// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ArcAgentEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum EscrowStatus {
        Funded,
        Submitted,
        Disputed,
        Completed,
        Refunded,
        Expired
    }

    struct Escrow {
        uint256 id;
        address client;
        address worker;
        address evaluator;
        uint256 amount;
        string title;
        string description;
        uint256 deadline;
        EscrowStatus status;
        string deliveryProof;
        bytes32 deliveryHash;
        bool splitEnabled;
        uint256 createdAt;
        uint256 completedAt;
    }

    error ZeroAddress();
    error ZeroAmount();
    error InvalidWorker();
    error InvalidDeadline();
    error EscrowNotFound(uint256 escrowId);
    error UnauthorizedCaller();
    error InvalidStatus(EscrowStatus currentStatus);
    error FeeTooHigh(uint256 feeBps);
    error NativeTransfersNotSupported();
    error EvaluatorCannotBeWorker();
    error NothingToWithdraw();

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed client,
        address indexed worker,
        address evaluator,
        uint256 amount,
        uint256 deadline,
        bool splitEnabled
    );
    event DeliverySubmitted(uint256 indexed escrowId, address indexed worker, string deliveryProof, bytes32 deliveryHash);
    event DisputeRaised(uint256 indexed escrowId, address indexed raisedBy);
    event EscrowCompleted(
        uint256 indexed escrowId,
        address indexed worker,
        uint256 workerAmount,
        uint256 treasuryAmount,
        bytes32 reason
    );
    event EscrowRefunded(uint256 indexed escrowId, address indexed client, uint256 amount, bytes32 reason);
    event AutoExpired(uint256 indexed escrowId, address indexed worker, uint256 workerAmount, uint256 treasuryAmount);
    event WithdrawalQueued(address indexed recipient, uint256 amount);
    event Withdrawn(address indexed recipient, uint256 amount);
    event TreasuryUpdated(address indexed previousTreasury, address indexed newTreasury);
    event ProtocolFeeUpdated(uint256 previousFeeBps, uint256 newFeeBps);

    uint256 public constant MAX_PROTOCOL_FEE_BPS = 2000;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    IERC20 public immutable usdcToken;
    address public treasury;

    uint256 private _escrowCount;
    uint256 private _protocolFeeBps = 1000;

    mapping(uint256 => Escrow) private _escrows;
    mapping(address => uint256[]) private _clientEscrows;
    mapping(address => uint256[]) private _workerEscrows;
    mapping(address => uint256[]) private _evaluatorEscrows;
    mapping(address => uint256) public pendingWithdrawals;

    constructor(address _usdcToken, address initialOwner) Ownable(initialOwner) {
        if (_usdcToken == address(0) || initialOwner == address(0)) revert ZeroAddress();

        usdcToken = IERC20(_usdcToken);
        treasury = initialOwner;
    }

    function createEscrow(
        address worker,
        address evaluator,
        uint256 amount,
        string calldata title,
        string calldata description,
        uint256 deadline,
        bool splitEnabled
    ) external nonReentrant returns (uint256 escrowId) {
        if (worker == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (worker == msg.sender) revert InvalidWorker();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        address resolvedEvaluator = evaluator == address(0) ? msg.sender : evaluator;
        if (resolvedEvaluator == worker) revert EvaluatorCannotBeWorker();

        escrowId = ++_escrowCount;

        uint256 balanceBefore = usdcToken.balanceOf(address(this));
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = usdcToken.balanceOf(address(this)) - balanceBefore;

        _storeEscrow(
            escrowId,
            msg.sender,
            worker,
            resolvedEvaluator,
            received,
            title,
            description,
            deadline,
            splitEnabled
        );

        emit EscrowCreated(escrowId, msg.sender, worker, resolvedEvaluator, received, deadline, splitEnabled);
    }

    function submitDelivery(uint256 escrowId, string calldata deliveryProof, bytes32 deliveryHash) external {
        Escrow storage escrow = _escrows[escrowId];
        if (escrow.id == 0) revert EscrowNotFound(escrowId);
        if (escrow.worker != msg.sender) revert UnauthorizedCaller();
        if (escrow.status != EscrowStatus.Funded) revert InvalidStatus(escrow.status);

        escrow.status = EscrowStatus.Submitted;
        escrow.deliveryProof = deliveryProof;
        escrow.deliveryHash = deliveryHash;

        emit DeliverySubmitted(escrowId, msg.sender, deliveryProof, deliveryHash);
    }

    function raiseDispute(uint256 escrowId) external {
        Escrow storage escrow = _escrows[escrowId];
        if (escrow.id == 0) revert EscrowNotFound(escrowId);
        if (msg.sender != escrow.client) revert UnauthorizedCaller();
        if (escrow.status != EscrowStatus.Funded && escrow.status != EscrowStatus.Submitted) {
            revert InvalidStatus(escrow.status);
        }

        escrow.status = EscrowStatus.Disputed;

        emit DisputeRaised(escrowId, msg.sender);
    }

    function completeEscrow(uint256 escrowId, bytes32 reason) external nonReentrant {
        Escrow storage escrow = _escrows[escrowId];
        if (escrow.id == 0) revert EscrowNotFound(escrowId);

        if (escrow.status == EscrowStatus.Submitted) {
            if (msg.sender != escrow.client && msg.sender != escrow.evaluator) revert UnauthorizedCaller();
        } else if (escrow.status == EscrowStatus.Disputed) {
            if (msg.sender != escrow.evaluator) revert UnauthorizedCaller();
        } else {
            revert InvalidStatus(escrow.status);
        }

        escrow.status = EscrowStatus.Completed;
        escrow.completedAt = block.timestamp;

        uint256 workerAmount = escrow.amount;
        uint256 treasuryAmount;

        if (escrow.splitEnabled) {
            treasuryAmount = (escrow.amount * _protocolFeeBps) / BPS_DENOMINATOR;
            workerAmount = escrow.amount - treasuryAmount;
        }

        if (treasuryAmount > 0) {
            pendingWithdrawals[treasury] += treasuryAmount;
            emit WithdrawalQueued(treasury, treasuryAmount);
        }

        pendingWithdrawals[escrow.worker] += workerAmount;
        emit WithdrawalQueued(escrow.worker, workerAmount);

        emit EscrowCompleted(escrowId, escrow.worker, workerAmount, treasuryAmount, reason);
    }

    function refundClient(uint256 escrowId, bytes32 reason) external nonReentrant {
        Escrow storage escrow = _escrows[escrowId];
        if (escrow.id == 0) revert EscrowNotFound(escrowId);

        if (escrow.status == EscrowStatus.Funded) {
            if (msg.sender != escrow.client) revert UnauthorizedCaller();
        } else if (escrow.status == EscrowStatus.Disputed) {
            if (msg.sender != escrow.evaluator) revert UnauthorizedCaller();
        } else {
            revert InvalidStatus(escrow.status);
        }

        escrow.status = EscrowStatus.Refunded;
        escrow.completedAt = block.timestamp;

        pendingWithdrawals[escrow.client] += escrow.amount;

        emit EscrowRefunded(escrowId, escrow.client, escrow.amount, reason);
        emit WithdrawalQueued(escrow.client, escrow.amount);
    }

    function autoExpire(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = _escrows[escrowId];
        if (escrow.id == 0) revert EscrowNotFound(escrowId);
        if (escrow.status != EscrowStatus.Submitted) revert InvalidStatus(escrow.status);
        if (block.timestamp <= escrow.deadline) revert InvalidDeadline();

        escrow.status = EscrowStatus.Expired;
        escrow.completedAt = block.timestamp;

        uint256 workerAmount = escrow.amount;
        uint256 treasuryAmount;

        if (escrow.splitEnabled) {
            treasuryAmount = (escrow.amount * _protocolFeeBps) / BPS_DENOMINATOR;
            workerAmount = escrow.amount - treasuryAmount;
        }

        if (treasuryAmount > 0) {
            pendingWithdrawals[treasury] += treasuryAmount;
            emit WithdrawalQueued(treasury, treasuryAmount);
        }

        pendingWithdrawals[escrow.worker] += workerAmount;
        emit WithdrawalQueued(escrow.worker, workerAmount);

        emit AutoExpired(escrowId, escrow.worker, workerAmount, treasuryAmount);
    }

    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        pendingWithdrawals[msg.sender] = 0;
        usdcToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function getEscrow(uint256 id) external view returns (Escrow memory) {
        Escrow memory escrow = _escrows[id];
        if (escrow.id == 0) revert EscrowNotFound(id);
        return escrow;
    }

    function getClientEscrows(address client) external view returns (uint256[] memory) {
        return _clientEscrows[client];
    }

    function getWorkerEscrows(address worker) external view returns (uint256[] memory) {
        return _workerEscrows[worker];
    }

    function getEvaluatorEscrows(address evaluator) external view returns (uint256[] memory) {
        return _evaluatorEscrows[evaluator];
    }

    function escrowCount() external view returns (uint256) {
        return _escrowCount;
    }

    function getProtocolFeeBps() external view returns (uint256) {
        return _protocolFeeBps;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();

        address previousTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryUpdated(previousTreasury, newTreasury);
    }

    function setProtocolFeeBps(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_PROTOCOL_FEE_BPS) revert FeeTooHigh(newFeeBps);

        uint256 previousFeeBps = _protocolFeeBps;
        _protocolFeeBps = newFeeBps;

        emit ProtocolFeeUpdated(previousFeeBps, newFeeBps);
    }

    function _storeEscrow(
        uint256 escrowId,
        address client,
        address worker,
        address evaluator,
        uint256 amount,
        string calldata title,
        string calldata description,
        uint256 deadline,
        bool splitEnabled
    ) internal {
        Escrow storage escrow = _escrows[escrowId];
        escrow.id = escrowId;
        escrow.client = client;
        escrow.worker = worker;
        escrow.evaluator = evaluator;
        escrow.amount = amount;
        escrow.title = title;
        escrow.description = description;
        escrow.deadline = deadline;
        escrow.status = EscrowStatus.Funded;
        escrow.splitEnabled = splitEnabled;
        escrow.createdAt = block.timestamp;

        _clientEscrows[client].push(escrowId);
        _workerEscrows[worker].push(escrowId);
        _evaluatorEscrows[evaluator].push(escrowId);
    }

    receive() external payable {
        revert NativeTransfersNotSupported();
    }

    fallback() external payable {
        revert NativeTransfersNotSupported();
    }
}
