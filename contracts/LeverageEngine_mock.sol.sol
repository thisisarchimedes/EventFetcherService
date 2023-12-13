// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LeverageEngine_mock {
  // Define the events according to the given specifications
  event PositionOpened(
    uint256 indexed nftId,
    address indexed user,
    address indexed strategy,
    uint256 collateralAmount,
    uint256 wbtcToBorrow,
    uint256 positionExpireBlock,
    uint256 sharesReceived
  );
  event PositionClosed(
    uint256 indexed nftId,
    address indexed user,
    address indexed strategy,
    uint256 receivedAmount,
    uint256 wbtcDebtAmount,
    uint256 exitFee
  );
  event PositionLiquidated(
    uint256 indexed nftId,
    address indexed strategy,
    uint256 wbtcDebtPaid,
    uint256 claimableAmount,
    uint256 liquidationFee
  );

  // Function to emit the PositionOpened event
  function openPosition(
    uint256 _nftID,
    address _user,
    address _strategy,
    uint256 _collateralAmount,
    uint256 _wbtcToBorrow,
    uint256 _positionExpireBlock,
    uint256 _sharesReceived
  ) external {
    // Emit the PositionOpened event with the provided parameters
    emit PositionOpened(
      _nftID,
      _user,
      _strategy,
      _collateralAmount,
      _wbtcToBorrow,
      _positionExpireBlock,
      _sharesReceived
    );
  }

  // Function to emit the PositionClosed event
  function closePosition(
    uint256 _nftID,
    address _user,
    address _strategy,
    uint256 _receivedAmount,
    uint256 _wbtcDebtAmount,
    uint256 _exitFee
  ) external {
    // Emit the PositionClosed event with the provided parameters
    emit PositionClosed(
      _nftID,
      _user,
      _strategy,
      _receivedAmount,
      _wbtcDebtAmount,
      _exitFee
    );
  }

  function liquidatePosition(
    uint256 nftId,
    address strategy,
    uint256 wbtcDebtPaid,
    uint256 claimableAmount,
    uint256 liquidationFee
  ) external {
    emit PositionLiquidated(
      nftId,
      strategy,
      wbtcDebtPaid,
      claimableAmount,
      liquidationFee
    );
  }
}
