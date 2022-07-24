import DStorage from '../abis/DStorage.json'
import React, { Component } from 'react';
import Navbar from './Navbar'
import Main from './Main'
import Web3 from 'web3';
import './App.css';

//Declare IPFS
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values
// Infura is a free client that lets you host your files on IPFS

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  // connect the app with blockchain
  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3

    // Load account:
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    
    // Network ID
    const networkId = await web3.eth.net.getId()    // returns the ID of ethereum network
                                                    // that we will be using
    const networkData = DStorage.networks[networkId]
    
    if(networkData) {
      // Assign contract
      // Creates a new contract instance with all its methods and events defined in its json interface object.
      // read more: https://web3js.readthedocs.io/en/v1.7.4/web3-eth-contract.html#new-contract
      const dstorage = new web3.eth.Contract(DStorage.abi, networkData.address)      
      this.setState({ dstorage })

      // Get the files count
      const filesCount = await dstorage.methods.fileCount().call()
      this.setState({ filesCount })

      // Load files  & sort by the newest
      for (var i = filesCount; i >= 1; i--) {
        const file = await dstorage.methods.files(i).call()
        this.setState({
          files: [...this.state.files, file]
        })
      }
    } 
    else {
      window.alert('DStorage contract not deployed to detected network.')
    }

    this.setState({ loading: false });
  }

  // Get file from user
  // and convert it to buffer - file format that
  // can be uploaded on IPFS
  captureFile = event => {
    event.preventDefault()

    // event.target -> gets the element that triggered the event
    // files fetches you the list of files that were selected 
    // using input type = "file"
    const file = event.target.files[0]
    const reader = new window.FileReader()
    //https://developer.mozilla.org/en-US/docs/Web/API/FileReader

    reader.readAsArrayBuffer(file)
    
    // it is fired when a read has completed
    reader.onloadend = () => {
      this.setState({
        buffer: Buffer(reader.result),
        type: file.type,
        name: file.name
      })
      console.log('buffer', this.state.buffer)
    }
  }


  //Upload File to IPFS
  uploadFile = (description) => {

    //Add file to the IPFS
      ipfs.add(this.state.buffer, (error, result) => {
        //Check If error      
        if (error) {
          console.log(error);
          return;
        }
        
        console.log('IPFS Result: ', result);

        //Set state to loading
        this.setState({ loading: true });

        //Assign value for the file without extension
        if(this.state.type === ''){
          this.setState({type: 'none'})
        }

        //Call smart contract uploadFile function 
        this.state.dstorage.methods.uploadFile(
            result[0].hash, this.state.name, 
            result[0].size, this.state.type,
            description)
          .send({ from: this.state.account }).on('transactionHash', (hash) => {
            this.setState({
              loading: false,
              type: null,
              name: null
            })
            window.location.reload()
          }).on('error', (e) =>{
              window.alert('Error')
              this.setState({loading: false})
            })
      });


  }

  //Set states
  constructor(props) {
    super(props)
    this.state = {
      account: '',
      dstorage: null,
      files: [],
      loading: false,
      type: null,
      name: null
    }

    //Bind functions
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              files={this.state.files}
              captureFile={this.captureFile}
              uploadFile={this.uploadFile}
            />
        }
      </div>
    );
  }
}

export default App;