// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ArcAgentEscrow} from "../ArcAgentEscrow.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1_000_000 * 1e6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract ArcAgentEscrowTest is Test {
    ArcAgentEscrow public escrow;
    MockUSDC public usdc;

    address public owner = address(0xABCD);
    address public client = address(0x1111);
    address public worker = address(0x2222);
    address public evaluator = address(0x3333);

    uint256 public constant AMOUNT = 100 * 1e6; // 100 USDC

    function setUp() public {
        vm.startPrank(owner);
        usdc = new MockUSDC();
        escrow = new ArcAgentEscrow(address(usdc), owner);
        vm.stopPrank();

        usdc.mint(client, 10_000 * 1e6);
        vm.prank(client);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function test_CreateEscrow() public {
        vm.prank(client);
        uint256 deadline = block.timestamp + 1 days;
        uint256 escrowId = escrow.createEscrow(
            worker,
            evaluator,
            AMOUNT,
            "AI Agent Data Analysis",
            "Process off-chain data set and produce verified report",
            deadline,
            true // splitEnabled
        );

        assertEq(escrowId, 1);
        ArcAgentEscrow.Escrow memory e = escrow.getEscrow(1);
        assertEq(e.client, client);
        assertEq(e.worker, worker);
        assertEq(e.evaluator, evaluator);
        assertEq(e.amount, AMOUNT);
        assertEq(uint256(e.status), 0); // Funded
        assertEq(usdc.balanceOf(address(escrow)), AMOUNT);
    }

    function test_SubmitDelivery() public {
        vm.prank(client);
        uint256 deadline = block.timestamp + 1 days;
        uint256 escrowId = escrow.createEscrow(
            worker,
            evaluator,
            AMOUNT,
            "Autonomous Code Review",
            "Review smart contract code",
            deadline,
            false
        );

        bytes32 proofHash = sha256(bytes("https://ipfs.io/ipfs/QmReportHash123"));
        vm.prank(worker);
        escrow.submitDelivery(escrowId, "https://ipfs.io/ipfs/QmReportHash123", proofHash);

        ArcAgentEscrow.Escrow memory e = escrow.getEscrow(escrowId);
        assertEq(uint256(e.status), 1); // Submitted
        assertEq(e.deliveryHash, proofHash);
    }

    function test_ApproveDeliveryAndReleaseFunds() public {
        vm.prank(client);
        uint256 deadline = block.timestamp + 1 days;
        uint256 escrowId = escrow.createEscrow(
            worker,
            evaluator,
            AMOUNT,
            "Autonomous Agent Job",
            "Task desc",
            deadline,
            false // no protocol fee split
        );

        bytes32 proofHash = sha256(bytes("result-proof"));
        vm.prank(worker);
        escrow.submitDelivery(escrowId, "result-proof", proofHash);

        // Evaluator approves
        vm.prank(evaluator);
        escrow.approveDelivery(escrowId);

        ArcAgentEscrow.Escrow memory e = escrow.getEscrow(escrowId);
        assertEq(uint256(e.status), 3); // Completed

        // Worker withdraws pending funds
        uint256 pending = escrow.pendingWithdrawals(worker);
        assertEq(pending, AMOUNT);

        uint256 workerBalBefore = usdc.balanceOf(worker);
        vm.prank(worker);
        escrow.withdraw();
        assertEq(usdc.balanceOf(worker) - workerBalBefore, AMOUNT);
    }

    function test_AutoReleaseAfterDeadline() public {
        vm.prank(client);
        uint256 deadline = block.timestamp + 1 days;
        uint256 escrowId = escrow.createEscrow(
            worker,
            evaluator,
            AMOUNT,
            "Auto Release Test",
            "Task",
            deadline,
            false
        );

        bytes32 proofHash = sha256(bytes("deliverable"));
        vm.prank(worker);
        escrow.submitDelivery(escrowId, "deliverable", proofHash);

        // Warp time past deadline
        vm.warp(deadline + 1 seconds);

        // Anyone can trigger auto release after expiry
        escrow.claimAutoRelease(escrowId);

        ArcAgentEscrow.Escrow memory e = escrow.getEscrow(escrowId);
        assertEq(uint256(e.status), 5); // Expired / Auto-released
        assertEq(escrow.pendingWithdrawals(worker), AMOUNT);
    }
}
