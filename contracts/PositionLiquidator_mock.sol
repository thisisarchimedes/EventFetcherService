// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PositionLiquidator_mock {
  // Define the events according to the given specifications

  event PositionLiquidated(
    uint256 indexed nftId,
    address indexed strategy,
    uint256 wbtcDebtPaid,
    uint256 claimableAmount,
    uint256 liquidationFee
  );

  // Function to emit the PositionLiquidated event
  function liquidatePosition(
    uint256 nftId,
    address _strategy,
    uint256 _wbtcDebtPaid,
    uint256 _claimableAmount,
    uint256 _liquidationFee
  ) external {
    emit PositionLiquidated(
      nftId,
      _strategy,
      _wbtcDebtPaid,
      _claimableAmount,
      _liquidationFee
    );
  }
}
