// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title Non-transferable points for verified recycling submissions
contract RecyclingPointsLedger {
    struct Entry {
        address resident;
        uint256 quantity;
        string material;
        bool approved;
    }

    address public immutable owner;
    mapping(address => bool) public verifiers;
    mapping(address => uint256) public balances;
    Entry[] private entries;

    event VerifierUpdated(address indexed verifier, bool enabled);
    event EntrySubmitted(uint256 indexed entryId, address indexed resident, string material, uint256 quantity);
    event EntryApproved(uint256 indexed entryId, address indexed resident, address indexed verifier, uint256 points);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        verifiers[msg.sender] = true;
        emit VerifierUpdated(msg.sender, true);
    }

    function setVerifier(address verifier, bool enabled) external onlyOwner {
        require(verifier != address(0), "Zero address");
        verifiers[verifier] = enabled;
        emit VerifierUpdated(verifier, enabled);
    }

    /// @notice Quantity is a positive integer in the demo's standardized units.
    function submitEntry(string calldata material, uint256 quantity) external returns (uint256 entryId) {
        uint256 length = bytes(material).length;
        require(length > 0 && length <= 64, "Material length 1-64 bytes");
        require(quantity > 0, "Quantity must be positive");
        entryId = entries.length;
        entries.push(Entry(msg.sender, quantity, material, false));
        emit EntrySubmitted(entryId, msg.sender, material, quantity);
    }

    function approveEntry(uint256 entryId) external {
        require(verifiers[msg.sender], "Only verifier");
        require(entryId < entries.length, "Entry not found");
        Entry storage entry = entries[entryId];
        require(!entry.approved, "Already approved");
        entry.approved = true;
        balances[entry.resident] += entry.quantity;
        emit EntryApproved(entryId, entry.resident, msg.sender, entry.quantity);
    }

    function entryCount() external view returns (uint256) { return entries.length; }

    function getEntry(uint256 entryId) external view returns (Entry memory) {
        require(entryId < entries.length, "Entry not found");
        return entries[entryId];
    }
}
