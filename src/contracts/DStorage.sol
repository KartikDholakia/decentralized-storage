//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// pragma solidity ^0.5.0;

contract DStorage {
	string public name = "DStorage";		// Name
	uint public fileCount = 0;						// Number of files
	// Mapping fileId=>Struct: to store the hash of every file
	mapping(uint => File) public files;

	// Struct
	struct File {
		uint fileID;
		string fileHash;	// for IPFS
		string fileName;
		uint fileSize;
		string fileType;
		string fileDescription;
		uint uploadTime;
		address payable uploader;
	}

	// Event
	event fileUploaded(
		uint fileID,
		string fileHash,
		string fileName,
		uint fileSize,
		string fileType,
		string fileDescription,
		uint uploadTime,
		address payable uploader
	);

	constructor() {}

	// Upload File function
	function uploadFile(
		string memory _fileHash,
		string memory _fileName,
		uint _fileSize,
		string memory _fileType,
		string memory _fileDescription
	) public {
		// Make sure the file hash exists
		require((bytes(_fileHash).length > 0), 'Hash not provided!');

		// Make sure file type exists
		require((bytes(_fileType).length > 0), 'File type not provided!');

		// Make sure file description exists
		require((bytes(_fileDescription).length > 0), 'File Description not provided!');

		// Make sure file fileName exists
		require((bytes(_fileName).length > 0), 'File Name not provided!');

		// Make sure uploader address exists
		require((msg.sender != address(0)), "No ownder of the file!");

		// Make sure file size is more than 0
		require((_fileSize > 0), "File size can't be zero!");


		// Increment file id
		fileCount++;

		// Add File to the contract
		files[fileCount] = File(fileCount, 
					_fileHash, _fileName, _fileSize, 
					_fileType, _fileDescription, 
					block.timestamp, 
					payable(msg.sender));

		// Trigger an event
		emit fileUploaded(fileCount, _fileHash, _fileName, _fileSize, _fileType, _fileDescription, block.timestamp, payable(msg.sender));
	}

}