const SocialNetwork = artifacts.require('./SocialNetwork.sol')

require('chai')
  .use(require('chai-as-promised'))
  .should()


contract('SocialNetwork', ([deployer, author, tipper]) => {
  let socialNetwork

  before(async () => {
    socialNetwork = await SocialNetwork.deployed()
  })

  describe('deployment', async () => {
    it('deploys successfully', async () => {
      const address = await socialNetwork.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })

    it('has a name', async () => {
      const name = await socialNetwork.name()
      assert.equal(name, 'Veysel TOSUN solidity network')
    })
  })

  describe('posts', async () => {
    let result, postCount;

    before(async () => {
      result = await socialNetwork.createPost('This is my first post', {from : author});
      postCount = await socialNetwork.postCount();
    })

    it('creates posts', async () => {
        //SUCCESS
        assert.equal(postCount, 1);
        const event = result.logs[0].args
        assert.equal(event.id.toNumber(), postCount.toNumber(), "id is correct")
        assert.equal(event.content, "This is my first post", "content is correct")
        assert.equal(event.tipAmount, '0', "tip amount is correct")
        assert.equal(event.author, author, "author is correct")

        //FAILURE
        await socialNetwork.createPost('', {from : author}).should.be.rejected;
    })

    it('lists posts', async () => {
       //SUCCESS
       const post = await socialNetwork.posts(postCount);
       assert.equal(post.id.toNumber(), postCount.toNumber(), "id is correct")
       assert.equal(post.content, "This is my first post", "content is correct")
       assert.equal(post.tipAmount, '0', "tip amount is correct")
       assert.equal(post.author, author, "author is correct")
    })

    it('allows users to tip posts', async () => {
        let oldAuthorBalance = await web3.eth.getBalance(author);
        oldAuthorBalance = new web3.utils.BN(oldAuthorBalance);

        //SUCCESS
        result = await socialNetwork.tipPost(postCount, {from : tipper, value: web3.utils.toWei('1','Ether')})
        const event = result.logs[0].args
        assert.equal(event.id.toNumber(), postCount.toNumber(), "id is correct")
        assert.equal(event.content, "This is my first post", "content is correct")
        assert.equal(event.tipAmount, '1000000000000000000', "tip amount is correct")
        assert.equal(event.author, author, "author is correct")

        //check that author received funds
        let newAuthorBalance = await web3.eth.getBalance(author);
        newAuthorBalance = new web3.utils.BN(newAuthorBalance);

        let tipAmount = await web3.utils.toWei('1', 'Ether');
        tipAmount = new web3.utils.BN(tipAmount);

        const expectedBalance = oldAuthorBalance.add(tipAmount);

        assert.equal(newAuthorBalance.toString(), expectedBalance.toString());

        //FAILURE: tries to tip a post that does not exist
        await socialNetwork.tipPost(99, {from : tipper, value: web3.utils.toWei('1','Ether')}).should.be.rejected;
    })
  })
})
