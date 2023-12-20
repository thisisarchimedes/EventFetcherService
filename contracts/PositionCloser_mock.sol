// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PositionCloser_mock {
  // Define the events according to the given specifications

  event PositionClosed(
    uint256 indexed nftId,
    address indexed user,
    uint256 receivedAmount,
    uint256 wbtcDebtAmount
  );

  // Function to emit the PositionClosed event
  function closePosition(
    uint256 _nftId,
    address _user,
    uint256 _receivedAmount,
    uint256 _wbtcDebtAmount
  ) external {
    // Emit the PositionClosed event with the provided parameters
    emit PositionClosed(_nftId, _user, _receivedAmount, _wbtcDebtAmount);
  }
}
