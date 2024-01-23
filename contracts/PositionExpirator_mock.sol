// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PositionExpirator_mock {
  // Define the events according to the given specifications

  event PositionExpired(
    uint256 indexed nftId,
    address indexed user,
    uint256 receivedAmount,
    uint256 wbtcDebtAmount
  );

  // Function to emit the PositionExpired event
  function expirePosition(
    uint256 _nftId,
    address _user,
    uint256 _receivedAmount,
    uint256 _wbtcDebtAmount
  ) external {
    // Emit the PositionExpired event with the provided parameters
    emit PositionExpired(_nftId, _user, _receivedAmount, _wbtcDebtAmount);
  }
}
