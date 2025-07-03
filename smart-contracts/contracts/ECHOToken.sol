// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract ECHOToken is 
    Initializable, 
    ERC20Upgradeable, 
    ERC20BurnableUpgradeable, 
    OwnableUpgradeable, 
    ERC20PermitUpgradeable,
    UUPSUpgradeable 
{
    string private _tokenURI;
    uint256 public MAX_SUPPLY;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) initializer public {
        __ERC20_init("ECHO", "ECHO");
        __ERC20Burnable_init();
        __Ownable_init(initialOwner);
        __ERC20Permit_init("ECHO");
        __UUPSUpgradeable_init();
        
        MAX_SUPPLY = 1_000_000_000_000 * 10**18;
        _mint(initialOwner, 1_000_000_000_000 * 10**18);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds maximum token supply");
        _mint(to, amount);
    }

    function setTokenURI(string memory newTokenURI) public onlyOwner {
        _tokenURI = newTokenURI;
    }

    function tokenURI() public view returns (string memory) {
        return _tokenURI;
    }

    function setMaxSupply(uint256 newMaxSupply) public onlyOwner {
        require(newMaxSupply >= totalSupply(), "New max supply must be >= total supply");
        MAX_SUPPLY = newMaxSupply;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
}
