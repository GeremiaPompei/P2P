const Lottery = artifacts.require("Lottery");

const CLASSES = {
  Class1: 1,
  Class2: 2,
  Class3: 3,
  Class4: 4,
  Class5: 5,
  Class6: 6,
  Class7: 7,
  Class8: 8,
};

const STATES = {
  Buy: 0,
  Draw: 1,
  Prize: 2,
  RoundFinished: 3,
  Close: 4
}

contract("Lottery", accounts => {
  const owner = accounts[0];
  const player1 = accounts[1];
  const player2 = accounts[2];
  it("should lottery state be BUY", async () => {
    const instance = await Lottery.deployed();
    const state = await instance.state({from: owner});
    assert.equal(state, STATES.Buy, "round state isn't correct");
  });
  it("should players buy tickets and state become DRAW", async () => {
    const instance = await Lottery.deployed();
    const ticketPrice = await instance.ticketPrice();
    await instance.buy([1, 2, 3, 4, 5, 6], {from: player1, value: ticketPrice});
    await instance.buy([7, 8, 9, 10, 11, 12], {from: player2, value: ticketPrice});
    const state = await instance.state({from: owner});
    assert.equal(state, STATES.Draw, "round state isn't correct");
  });
  it("should owner mint NFT", async () => {
    const instance = await Lottery.deployed();
    await instance.mint("NFT_1", CLASSES.Class1, {from: owner});
    await instance.mint("NFT_2", CLASSES.Class2, {from: owner});
    await instance.mint("NFT_3", CLASSES.Class3, {from: owner});
    await instance.mint("NFT_4", CLASSES.Class4, {from: owner});
    await instance.mint("NFT_5", CLASSES.Class5, {from: owner});
    await instance.mint("NFT_6", CLASSES.Class6, {from: owner});
    await instance.mint("NFT_7", CLASSES.Class7, {from: owner});
    await instance.mint("NFT_8", CLASSES.Class8, {from: owner});
  });
  it("should owner draw numbers and state become PRIZE", async () => {
    const instance = await Lottery.deployed();
    await instance.drawNumbers({from: owner});
    const state = await instance.state({from: owner});
    assert.equal(state, STATES.Prize, "round state isn't correct");
  });
  it("should owner give prizes numbers and state become ROUNDFINISHED", async () => {
    const instance = await Lottery.deployed();
    await instance.givePrizes({from: owner});
    const state = await instance.state({from: owner});
    assert.equal(state, STATES.RoundFinished, "round state isn't correct");
  });
  it("should owner close lottery and state become CLOSE", async () => {
    const instance = await Lottery.deployed();
    await instance.closeLottery({from: owner});
    const state = await instance.state({from: owner});
    assert.equal(state, STATES.Close, "round state isn't correct");
  });
});