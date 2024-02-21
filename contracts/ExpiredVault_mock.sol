// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ExpiredVault_mock {
  // Define the events according to the given specifications

  event Claim(address indexed claimer, uint256 indexed nftId, uint256 amount);

  // Function to emit the Claim event
  function claim(
    address _claimer,
    uint256 _nftId,
    uint256 _claimableAmount
  ) external {
    // Emit the Claim event with the provided parameters
    emit Claim(_claimer, _nftId, _claimableAmount);
  }
}
