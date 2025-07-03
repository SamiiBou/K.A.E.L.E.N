// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract DistributorUpgradeable is 
    Initializable, 
    EIP712Upgradeable, 
    OwnableUpgradeable,
    UUPSUpgradeable 
{
    IERC20 public token;
    address public signer;
    mapping(bytes32 => bool) public redeemed;
    
    // Additional upgradable features
    bool public claimingPaused;
    uint256 public minimumClaimAmount;
    uint256 public maximumClaimAmount;

    struct Voucher {
        address to;
        uint256 amount;
        uint256 nonce;
        uint256 deadline;
    }

    bytes32 private constant VOUCHER_TYPEHASH =
        keccak256("Voucher(address to,uint256 amount,uint256 nonce,uint256 deadline)");

    event Claimed(address indexed to, uint256 amount);
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);
    event ClaimingPausedUpdated(bool paused);
    event ClaimLimitsUpdated(uint256 minimum, uint256 maximum);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address token_, 
        address signer_,
        address initialOwner
    ) initializer public {
        __EIP712_init("Distributor", "1");
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        
        token = IERC20(token_);
        signer = signer_;
        claimingPaused = false;
        minimumClaimAmount = 0;
        maximumClaimAmount = type(uint256).max;
    }

    function setSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid signer address");
        address oldSigner = signer;
        signer = newSigner;
        emit SignerUpdated(oldSigner, newSigner);
    }

    function setClaimingPaused(bool paused) external onlyOwner {
        claimingPaused = paused;
        emit ClaimingPausedUpdated(paused);
    }

    function setClaimLimits(uint256 minimum, uint256 maximum) external onlyOwner {
        require(minimum <= maximum, "Invalid limits");
        minimumClaimAmount = minimum;
        maximumClaimAmount = maximum;
        emit ClaimLimitsUpdated(minimum, maximum);
    }

    function updateToken(address newToken) external onlyOwner {
        require(newToken != address(0), "Invalid token address");
        token = IERC20(newToken);
    }

    function claim(Voucher calldata v, bytes calldata sig) external {
        require(!claimingPaused, "Claiming is paused");
        require(block.timestamp <= v.deadline, "Expired voucher");
        require(v.to == msg.sender, "Not the recipient");
        require(v.amount >= minimumClaimAmount, "Amount too low");
        require(v.amount <= maximumClaimAmount, "Amount too high");

        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(
                VOUCHER_TYPEHASH,
                v.to, 
                v.amount, 
                v.nonce, 
                v.deadline
            ))
        );
        
        require(!redeemed[digest], "Already redeemed");
        require(ECDSA.recover(digest, sig) == signer, "Invalid signature");

        redeemed[digest] = true;
        require(token.transfer(v.to, v.amount), "Transfer failed");
        
        emit Claimed(v.to, v.amount);
    }

    /**
     * @dev Emergency function to withdraw tokens
     */
    function emergencyWithdraw(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20(tokenAddress).transfer(owner(), amount);
    }

    /**
     * @dev Required by UUPS pattern to authorize upgrades
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
} 