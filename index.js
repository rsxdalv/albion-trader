({
    recycle: true
})

var { Cap, decoders } = require('cap');
const { parsePhoton } = require('./photon');
var PROTOCOL = decoders.PROTOCOL;
var network = require('network');

var c = new Cap();
let linkType;
var buffer = Buffer.alloc(65535);

network.get_active_interface(function (err, obj) {
    if (err) {
        throw new Error("Can't find active network interface (disconnected?)")
    }
    var device = Cap.findDevice(obj.ip_address);
    var filter = 'udp and port 5056';
    var bufSize = 10 * 1024 * 1024;
    linkType = c.open(device, filter, bufSize, buffer);
    c.setMinBytes && c.setMinBytes(0);

})

c.on('packet', /**
    * @param {string} nbytes
    * @param {any} trunc
    */
function (nbytes, trunc) {
    // console.log('packet: length ' + nbytes + ' bytes, truncated? '
    //     + (trunc ? 'yes' : 'no'));
    // raw packet data === buffer.slice(0, nbytes)

    if (linkType === 'ETHERNET') {
        var ret = decoders.Ethernet(buffer);
        if (ret.info.type === PROTOCOL.ETHERNET.IPV4) {
            ret = decoders.IPV4(buffer, ret.offset);
            // console.log('from: ' + ret.info.srcaddr + ' to ' + ret.info.dstaddr);

            if (ret.info.protocol === PROTOCOL.IP.UDP) {
                ret = decoders.UDP(buffer, ret.offset);
                parsePhoton(buffer.slice(ret.offset))
            } else
                console.log('Unsupported IPv4 protocol: ' + PROTOCOL.IP[ret.info.protocol]);
        } else
            console.log('Unsupported Ethertype: ' + PROTOCOL.ETHERNET[ret.info.type]);
    }
}); 