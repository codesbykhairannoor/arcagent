// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ArcMilestoneEscrow} from "../ArcMilestoneEscrow.sol";
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

contract ArcMilestoneEscrowTest is Test {
    ArcMilestoneEscrow public milestoneEscrow;
    MockUSDC public usdc;

    address public owner = address(0xABCD);
    address public client = address(0x1111);
    address public worker = address(0x2222);
    address public evaluator = address(0x3333);

    function setUp() public {
        vm.startPrank(owner);
        usdc = new MockUSDC();
        milestoneEscrow = new ArcMilestoneEscrow(address(usdc), owner);
        vm.stopPrank();

        usdc.mint(client, 10_000 * 1e6);
        vm.prank(client);
        usdc.approve(address(milestoneEscrow), type(uint256).max);
    }

    function test_CreateMilestoneJob() public {
        ArcMilestoneEscrow.CreateJobParams memory p = ArcMilestoneEscrow.CreateJobParams({
            worker: worker,
            evaluator: evaluator,
            jobTitle: "Autonomous AI Agent Swarm Development",
            splitEnabled: false
        });

        ArcMilestoneEscrow.MilestoneInput[] memory ms = new ArcMilestoneEscrow.MilestoneInput[](2);
        ms[0] = ArcMilestoneEscrow.MilestoneInput({
            amount: 50 * 1e6,
            title: "Phase 1: Architecture Spec",
            description: "System design & skill.md",
            deadline: block.timestamp + 1 days
        });
        ms[1] = ArcMilestoneEscrow.MilestoneInput({
            amount: 150 * 1e6,
            title: "Phase 2: Full Deployment",
            description: "Agent daemon on Arc Testnet",
            deadline: block.timestamp + 3 days
        });

        vm.prank(client);
        uint256 jobId = milestoneEscrow.createJob(p, ms);

        assertEq(jobId, 1);
        ArcMilestoneEscrow.Job memory job = milestoneEscrow.getJob(1);
        assertEq(job.client, client);
        assertEq(job.worker, worker);
        assertEq(job.totalAmount, 200 * 1e6);
        assertEq(job.milestoneCount, 2);
    }

    function test_SubmitAndApproveMilestone() public {
        ArcMilestoneEscrow.CreateJobParams memory p = ArcMilestoneEscrow.CreateJobParams({
            worker: worker,
            evaluator: evaluator,
            jobTitle: "Multi-Phase Project",
            splitEnabled: false
        });

        ArcMilestoneEscrow.MilestoneInput[] memory ms = new ArcMilestoneEscrow.MilestoneInput[](2);
        ms[0] = ArcMilestoneEscrow.MilestoneInput({
            amount: 50 * 1e6,
            title: "Milestone 1",
            description: "Desc 1",
            deadline: block.timestamp + 1 days
        });
        ms[1] = ArcMilestoneEscrow.MilestoneInput({
            amount: 50 * 1e6,
            title: "Milestone 2",
            description: "Desc 2",
            deadline: block.timestamp + 2 days
        });

        vm.prank(client);
        uint256 jobId = milestoneEscrow.createJob(p, ms);

        // Worker submits milestone 0
        bytes32 proofHash = sha256(bytes("proof-m1"));
        vm.prank(worker);
        milestoneEscrow.submitMilestone(jobId, 0, "proof-m1", proofHash);

        // Evaluator approves milestone 0
        vm.prank(evaluator);
        milestoneEscrow.approveMilestone(jobId, 0);

        ArcMilestoneEscrow.Milestone memory m0 = milestoneEscrow.getMilestone(jobId, 0);
        assertEq(uint256(m0.status), 3); // Completed

        // Worker withdraws Phase 1 funds
        uint256 pending = milestoneEscrow.pendingWithdrawals(worker);
        assertEq(pending, 50 * 1e6);

        vm.prank(worker);
        milestoneEscrow.withdraw();
        assertEq(usdc.balanceOf(worker), 50 * 1e6);
    }
}
