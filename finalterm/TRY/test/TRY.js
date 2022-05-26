const TRY = artifacts.require("TRY");

contract("TRY", accounts => {
    it("should lottery be active", () =>
    TRY.deployed()
        .then(instance => instance.isRoundActive())
        .then(status => {
          assert.isTrue(
            status,
            "round is not active"
          );
        }));
    });