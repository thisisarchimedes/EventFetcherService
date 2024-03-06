// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PositionCloser_mock {
  // Define the events according to the given specifications

  event PositionClosed(
        uint256 indexed nftId, 
        address indexed user, 
        address indexed strategy,
        uint256 receivedAmount, 
        uint256 wbtcDebtAmount
    );

  // Function to emit the PositionClosed event
  function closePosition(
    uint256 _nftId,
    address _user,
    address _strategy,
    uint256 _receivedAmount,
    uint256 _wbtcDebtAmount
  ) external {
    // Emit the PositionClosed event with the provided parameters
    emit PositionClosed(_nftId, _user, _strategy, _receivedAmount, _wbtcDebtAmount);
  }
}
