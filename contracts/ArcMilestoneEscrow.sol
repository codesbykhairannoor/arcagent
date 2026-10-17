// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ArcMilestoneEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum MilestoneStatus {
        Pending,
        Submitted,
        Disputed,
        Completed,
        Refunded,
        Expired
    }

    struct Milestone {
        uint256 milestoneId;
        uint256 amount;
        string title;
        string description;
        uint256 deadline;
        MilestoneStatus status;
        string deliveryProof;
        bytes32 deliveryHash;
        uint256 completedAt;
    }

    struct Job {
        uint256 jobId;
        address client;
        address worker;
        address evaluator;
        uint256 totalAmount;
        string jobTitle;
        bool splitEnabled;
        uint256 createdAt;
        uint256 milestoneCount;
    }

    struct MilestoneInput {
        uint256 amount;
        string title;
        string description;
        uint256 deadline;
    }

    error ZeroAddress();
    error ZeroAmount();
    error InvalidWorker();
    error InvalidDeadline();
    error JobNotFound(uint256 jobId);
    error MilestoneNotFound(uint256 jobId, uint256 milestoneId);
    error UnauthorizedCaller();
    error InvalidStatus(MilestoneStatus currentStatus);
    error FeeTooHigh(uint256 feeBps);
    error NativeTransfersNotSupported();
    error EvaluatorCannotBeWorker();
    error NothingToWithdraw();
    error NoMilestones();
    error TooManyMilestones();
    error MilestonesStillActive();

    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        address indexed worker,
        address evaluator,
        uint256 totalAmount,
        uint256 milestoneCount,
        bool splitEnabled
    );
    event MilestoneSubmitted(
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        address indexed worker,
        string deliveryProof,
        bytes32 deliveryHash
    );
    event MilestoneCompleted(
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        address indexed worker,
        uint256 workerAmount,
        uint256 treasuryAmount
    );
    event MilestoneRefunded(uint256 indexed jobId, uint256 indexed milestoneId, address indexed client, uint256 amount);
    event DisputeRaised(uint256 indexed jobId, uint256 indexed milestoneId, address indexed raisedBy);
    event AutoExpired(
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        address indexed worker,
        uint256 workerAmount,
        uint256 treasuryAmount
    );
    event WithdrawalQueued(address indexed recipient, uint256 amount);
    event Withdrawn(address indexed recipient, uint256 amount);
    event TreasuryUpdated(address indexed previousTreasury, address indexed newTreasury);
    event ProtocolFeeUpdated(uint256 previousFeeBps, uint256 newFeeBps);

    uint256 public constant MAX_PROTOCOL_FEE_BPS = 2000;
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant MAX_MILESTONES = 20;

    IERC20 public immutable usdcToken;
    address public treasury;

    uint256 private _jobCount;
    uint256 private _protocolFeeBps = 1000;

    mapping(uint256 => Job) private _jobs;
    mapping(uint256 => Milestone[]) private _milestones;
    mapping(address => uint256[]) private _clientJobs;
    mapping(address => uint256[]) private _workerJobs;
    mapping(address => uint256[]) private _evaluatorJobs;
    mapping(address => uint256) public pendingWithdrawals;

    constructor(address _usdcToken, address initialOwner) Ownable(initialOwner) {
        if (_usdcToken == address(0) || initialOwner == address(0)) revert ZeroAddress();

        usdcToken = IERC20(_usdcToken);
        treasury = initialOwner;
    }

    // Packed params to dodge stack-too-deep on Paris EVM (string calldata = 2 slots)
    struct CreateJobParams {
        address worker;
        address evaluator;
        string jobTitle;
        bool splitEnabled;
    }

    function createJob(
        CreateJobParams calldata p,
        MilestoneInput[] calldata milestones
    ) external nonReentrant returns (uint256 jobId) {
        if (p.worker == address(0)) revert ZeroAddress();
        if (p.worker == msg.sender) revert InvalidWorker();
        if (milestones.length == 0) revert NoMilestones();
        if (milestones.length > MAX_MILESTONES) revert TooManyMilestones();

        address resolvedEvaluator = p.evaluator == address(0) ? msg.sender : p.evaluator;
        if (resolvedEvaluator == p.worker) revert EvaluatorCannotBeWorker();

        // Validate milestones + compute total
        (uint256 totalAmount, uint256 received) = _validateAndTransfer(milestones);

        jobId = ++_jobCount;
        _storeJob(jobId, msg.sender, p.worker, resolvedEvaluator, received, p.jobTitle, p.splitEnabled, milestones.length);
        _storeMilestones(jobId, milestones, milestones.length, received, totalAmount);

        emit JobCreated(jobId, msg.sender, p.worker, resolvedEvaluator, received, milestones.length, p.splitEnabled);
    }

    function _validateAndTransfer(MilestoneInput[] calldata milestones)
        internal returns (uint256 totalAmount, uint256 received)
    {
        for (uint256 i; i < milestones.length; ++i) {
            if (milestones[i].amount == 0) revert ZeroAmount();
            if (milestones[i].deadline <= block.timestamp) revert InvalidDeadline();
            totalAmount += milestones[i].amount;
        }
        uint256 balanceBefore = usdcToken.balanceOf(address(this));
        usdcToken.safeTransferFrom(msg.sender, address(this), totalAmount);
        received = usdcToken.balanceOf(address(this)) - balanceBefore;
        if (received == 0) revert ZeroAmount();
    }

    function submitMilestone(uint256 jobId, uint256 milestoneId, string calldata deliveryProof, bytes32 deliveryHash)
        external
    {
        Job storage job = _getJobStorage(jobId);
        if (msg.sender != job.worker) revert UnauthorizedCaller();

        Milestone storage milestone = _getMilestoneStorage(jobId, milestoneId);
        if (milestone.status != MilestoneStatus.Pending) revert InvalidStatus(milestone.status);

        milestone.status = MilestoneStatus.Submitted;
        milestone.deliveryProof = deliveryProof;
        milestone.deliveryHash = deliveryHash;

        emit MilestoneSubmitted(jobId, milestoneId, msg.sender, deliveryProof, deliveryHash);
    }

    function raiseDispute(uint256 jobId, uint256 milestoneId) external {
        Job storage job = _getJobStorage(jobId);
        if (msg.sender != job.client) revert UnauthorizedCaller();

        Milestone storage milestone = _getMilestoneStorage(jobId, milestoneId);
        if (milestone.status != MilestoneStatus.Pending && milestone.status != MilestoneStatus.Submitted) {
            revert InvalidStatus(milestone.status);
        }

        milestone.status = MilestoneStatus.Disputed;

        emit DisputeRaised(jobId, milestoneId, msg.sender);
    }

    function completeMilestone(uint256 jobId, uint256 milestoneId) external nonReentrant {
        Job storage job = _getJobStorage(jobId);
        Milestone storage milestone = _getMilestoneStorage(jobId, milestoneId);

        if (milestone.status == MilestoneStatus.Submitted) {
            if (msg.sender != job.client && msg.sender != job.evaluator) revert UnauthorizedCaller();
        } else if (milestone.status == MilestoneStatus.Disputed) {
            if (msg.sender != job.evaluator) revert UnauthorizedCaller();
        } else {
            revert InvalidStatus(milestone.status);
        }

        milestone.status = MilestoneStatus.Completed;
        milestone.completedAt = block.timestamp;

        (uint256 workerAmount, uint256 treasuryAmount) = _computeSplit(milestone.amount, job.splitEnabled);

        if (treasuryAmount > 0) {
            pendingWithdrawals[treasury] += treasuryAmount;
            emit WithdrawalQueued(treasury, treasuryAmount);
        }

        pendingWithdrawals[job.worker] += workerAmount;
        emit WithdrawalQueued(job.worker, workerAmount);

        emit MilestoneCompleted(jobId, milestoneId, job.worker, workerAmount, treasuryAmount);
    }

    function refundMilestone(uint256 jobId, uint256 milestoneId) external nonReentrant {
        Job storage job = _getJobStorage(jobId);
        Milestone storage milestone = _getMilestoneStorage(jobId, milestoneId);

        if (milestone.status == MilestoneStatus.Pending) {
            if (msg.sender != job.client) revert UnauthorizedCaller();
        } else if (milestone.status == MilestoneStatus.Disputed) {
            if (msg.sender != job.evaluator) revert UnauthorizedCaller();
        } else {
            revert InvalidStatus(milestone.status);
        }

        milestone.status = MilestoneStatus.Refunded;
        milestone.completedAt = block.timestamp;

        pendingWithdrawals[job.client] += milestone.amount;

        emit MilestoneRefunded(jobId, milestoneId, job.client, milestone.amount);
        emit WithdrawalQueued(job.client, milestone.amount);
    }

    function autoExpireMilestone(uint256 jobId, uint256 milestoneId) external nonReentrant {
        Job storage job = _getJobStorage(jobId);
        Milestone storage milestone = _getMilestoneStorage(jobId, milestoneId);

        if (milestone.status != MilestoneStatus.Submitted) revert InvalidStatus(milestone.status);
        if (block.timestamp <= milestone.deadline) revert InvalidDeadline();

        milestone.status = MilestoneStatus.Expired;
        milestone.completedAt = block.timestamp;

        (uint256 workerAmount, uint256 treasuryAmount) = _computeSplit(milestone.amount, job.splitEnabled);

        if (treasuryAmount > 0) {
            pendingWithdrawals[treasury] += treasuryAmount;
            emit WithdrawalQueued(treasury, treasuryAmount);
        }

        pendingWithdrawals[job.worker] += workerAmount;
        emit WithdrawalQueued(job.worker, workerAmount);

        emit AutoExpired(jobId, milestoneId, job.worker, workerAmount, treasuryAmount);
    }

    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        pendingWithdrawals[msg.sender] = 0;
        usdcToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function getJob(uint256 jobId) external view returns (Job memory) {
        Job memory job = _jobs[jobId];
        if (job.jobId == 0) revert JobNotFound(jobId);
        return job;
    }

    function getMilestone(uint256 jobId, uint256 milestoneId) external view returns (Milestone memory) {
        Job memory job = _jobs[jobId];
        if (job.jobId == 0) revert JobNotFound(jobId);

        Milestone[] storage milestones = _milestones[jobId];
        if (milestoneId == 0 || milestoneId > milestones.length) revert MilestoneNotFound(jobId, milestoneId);

        return milestones[milestoneId - 1];
    }

    function getMilestones(uint256 jobId) external view returns (Milestone[] memory) {
        Job memory job = _jobs[jobId];
        if (job.jobId == 0) revert JobNotFound(jobId);
        return _milestones[jobId];
    }

    function getClientJobs(address client) external view returns (uint256[] memory) {
        return _clientJobs[client];
    }

    function getWorkerJobs(address worker) external view returns (uint256[] memory) {
        return _workerJobs[worker];
    }

    function getEvaluatorJobs(address evaluator) external view returns (uint256[] memory) {
        return _evaluatorJobs[evaluator];
    }

    function jobCount() external view returns (uint256) {
        return _jobCount;
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

    function _getJobStorage(uint256 jobId) internal view returns (Job storage job) {
        job = _jobs[jobId];
        if (job.jobId == 0) revert JobNotFound(jobId);
    }

    function _getMilestoneStorage(uint256 jobId, uint256 milestoneId) internal view returns (Milestone storage milestone) {
        Milestone[] storage milestones = _milestones[jobId];
        if (milestoneId == 0 || milestoneId > milestones.length) revert MilestoneNotFound(jobId, milestoneId);
        milestone = milestones[milestoneId - 1];
    }

    function _computeSplit(uint256 amount, bool splitEnabled)
        internal
        view
        returns (uint256 workerAmount, uint256 treasuryAmount)
    {
        workerAmount = amount;
        if (splitEnabled) {
            treasuryAmount = (amount * _protocolFeeBps) / BPS_DENOMINATOR;
            workerAmount = amount - treasuryAmount;
        }
    }

    // ── Internal helpers (reduce stack depth in createJob) ───────────────────────

    function _storeJob(
        uint256 jobId,
        address client,
        address worker,
        address evaluator,
        uint256 received,
        string calldata jobTitle,
        bool splitEnabled,
        uint256 milestoneCount
    ) internal {
        Job storage job = _jobs[jobId];
        job.jobId = jobId;
        job.client = client;
        job.worker = worker;
        job.evaluator = evaluator;
        job.totalAmount = received;
        job.jobTitle = jobTitle;
        job.splitEnabled = splitEnabled;
        job.createdAt = block.timestamp;
        job.milestoneCount = milestoneCount;

        _clientJobs[client].push(jobId);
        _workerJobs[worker].push(jobId);
        _evaluatorJobs[evaluator].push(jobId);
    }

    function _storeMilestones(
        uint256 jobId,
        MilestoneInput[] calldata inputs,
        uint256 milestoneLength,
        uint256 received,
        uint256 totalAmount
    ) internal {
        uint256 allocated;
        for (uint256 i; i < milestoneLength; ++i) {
            MilestoneInput calldata m = inputs[i];
            uint256 scaledAmount = i + 1 == milestoneLength
                ? received - allocated
                : (m.amount * received) / totalAmount;
            allocated += scaledAmount;
            _milestones[jobId].push(
                Milestone({
                    milestoneId: i + 1,
                    amount: scaledAmount,
                    title: m.title,
                    description: m.description,
                    deadline: m.deadline,
                    status: MilestoneStatus.Pending,
                    deliveryProof: "",
                    deliveryHash: bytes32(0),
                    completedAt: 0
                })
            );
        }
    }

    receive() external payable {
        revert NativeTransfersNotSupported();
    }

    fallback() external payable {
        revert NativeTransfersNotSupported();
    }
}
