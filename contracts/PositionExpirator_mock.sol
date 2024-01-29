// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PositionExpirator_mock {
  // Define the events according to the given specifications

  event PositionExpired(
    uint256 indexed nftId,
    address indexed user,
    uint256 claimableAmount
  );

  // Function to emit the PositionExpired event
  function expirePosition(
    uint256 _nftId,
    address _user,
    uint256 _claimableAmount
  ) external {
    // Emit the PositionExpired event with the provided parameters
    emit PositionExpired(_nftId, _user, _claimableAmount);
  }
}
