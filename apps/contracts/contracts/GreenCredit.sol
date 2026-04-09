// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GreenCredit is ERC20, Ownable {
    // Pass the msg.sender to the Ownable constructor (required in OpenZeppelin v5)
    constructor() ERC20("GreenCredit", "GCRD") Ownable(msg.sender) {}

    // Only the platform admin (the backend API) can mint new credits
    function mintReward(address supplierWallet, uint256 amount) public onlyOwner {
        // Mint the tokens (amount is in wei, so 1 token = 10^18)
        _mint(supplierWallet, amount * 10 ** decimals());
    }
}