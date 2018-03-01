var addon = require('bindings')('mmapfile');

{
	let len = 12;
	
	// open a file for read/write & map to Buffer
	let wb = addon.openSync("buf.txt", len, "r+");
	
	// open a file for read only & map to Buffer
	let rb = addon.openSync("buf.txt", len);

	console.log(wb, wb.length, wb.toString('ascii'));
	wb.fill('-');
	
	console.log(rb, rb.length, rb.toString('ascii'));
	
	rb = undefined;
	wb = undefined;
	global.gc();
	global.gc();
	global.gc();

}