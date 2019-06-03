const R = require('ramda');
const util = require('util')
const { streamConstructor, decodeParamsWithDebug } = require('./params');
const { parseReadMail } = require('./parse-read-mail')
const { parseMailInfo } = require('./parse-mail-info')
const { receiveMessage } = require('./web-server')
const { OPERATION_TYPES } = require('./op-dict');
const { readAuctions } = require('./auctions');

/**
 * @param {any} myObject
 */
const ins = myObject =>
    console.log(util.inspect(myObject, { showHidden: false, depth: null }))

// alternative shortcut
const colors = false;
/**
 * @param {any} myObject
 */
const ins2 = myObject =>
    // console.log(`${util.inspect(myObject, false, null, colors, /* enable colors */)},`)
    console.log(`${util.inspect(myObject, {
        maxArrayLength: null,
        colors,
        depth: null,
        showHidden: false,
    })},`)

// ENet commands 9, 10, and 11 aren't used in Photon AFAIK
const commandTypes = {
    1: "Acknowledge",
    2: "Connect",
    3: "Verify connect",
    4: "Disconnect",
    5: "Ping",
    6: "Send reliable",
    7: "Send unreliable",
    8: "Send reliable fragment",
    9: "Send unsequenced",
    10: "Configure bandwidth limit",
    11: "Configure throttling",
    12: "Fetch server timestamp"
}

const commandTypesEnum = {
    "ACKNOWLEDGE": 1,
    "CONNECT": 2,
    "VERIFY_CONNECT": 3,
    "DISCONNECT": 4,
    "PING": 5,
    "SEND_RELIABLE": 6,
    "SEND_UNRELIABLE": 7,
    "SEND_RELIABLE_FRAGMENT": 8,
    "SEND_UNSEQUENCED": 9,
    "CONFIGURE_BANDWIDTH_LIMIT": 10,
    "CONFIGURE_THROTTLING": 11,
    "FETCH_SERVER_TIMESTAMP": 12
}

// Altspace application-specific Photon channels
const channelNames = {
    1: "Photon view instantiation",
    2: "VoIP",
    3: "RPC",
    4: "Photon view serialization"
}

// Photon message types (things that can be sent in a command)
const messageTypes = {
    2: "Operation request",
    3: "Operation response",
    4: "Event data",
    7: "Operation response",
}

const messageTypesEnum = {
    "OPERATION_REQUEST": 2,
    "OPERATION_RESPONSE": 3,
    "EVENT_DATA": 4,
    "OPERATION_RESPONSE_ALT": 7,
}

// Photon operations
const operationNames = {
    220: "GetRegions",
    221: "GetLobbyStats",
    222: "FindFriends",
    223: "DebugGame",
    224: "CancelJoinRandomGame",
    225: "JoinRandomGame",
    226: "JoinGame",
    227: "CreateGame",
    228: "LeaveLobby",
    229: "JoinLobby",
    230: "Authenticate",
    248: "ChangeGroups",
    249: "Ping",
    251: "GetProperties",
    252: "SetProperties",
    253: "RaiseEvent",
    254: "Leave",
    255: "Join"
}

// Photon events
const eventNames = {
    // Generic Photon events
    210: "AzureNodeInfo",
    224: "TypedLobbyStats",
    226: "AppStats",
    227: "Match",
    228: "QueueState",
    229: "GameListUpdate",
    230: "GameList",
    253: "PropertiesChanged",
    254: "Leave",
    255: "Join",
    // PUN events
    200: "RPC",
    201: "SendSerialize",
    202: "Instantiation",
    203: "CloseConnection",
    204: "Destroy",
    205: "RemoveCachedRPCs",
    206: "SendSerializeReliable",
    207: "DestroyPlayer",
    208: "AssignMaster",
    209: "OwnershipRequest",
    // 210: "OwnershipTransfer",
    211: "VacantViewIds",
    // Altspace application-specific events
    135: "MulticastRPC",
    179: "VoIP"
}

/**
 * @param {Buffer} buf
 * @param {number} offset
 */
const parseCommand = (buf, tree, offset) => {
    let idx = offset;
    tree.commandType = buf.readUInt8(idx)
    tree.channelId = buf.readUInt8(idx + 1)
    tree.commandFlags = buf.readUInt8(idx + 2)
    tree.reservedByte = buf.readUInt8(idx + 3)
    tree.commandLength = buf.readUInt32BE(idx + 4)
    tree.relSeqNum = buf.readUInt32BE(idx + 8)
    const commandHeaderLength = 12
    const commandLength = tree.commandLength
    idx = idx + commandHeaderLength

    let command = tree.commandType;
    // command /*? commandTypes[$]*/
    // commandLength /*? $*/

    let dataLength
    switch (command) {
        case commandTypesEnum.ACKNOWLEDGE: return parseAcknowledgement(tree, buf, idx);
        case commandTypesEnum.SEND_UNRELIABLE: return parseSendUnreliable(tree, buf, idx, commandLength, commandHeaderLength);
        case commandTypesEnum.SEND_RELIABLE_FRAGMENT: return parseFragmentCommand(tree, buf, idx, commandLength, commandHeaderLength);
        case commandTypesEnum.CONNECT:
            // -- TODO: figure out what these bytes are
            dataLength = commandLength - commandHeaderLength
            tree.connData = buf.toString('ascii', idx, idx + dataLength);
            return idx + dataLength
        case commandTypesEnum.VERIFY_CONNECT:
            // -- TODO: figure out what these bytes are
            dataLength = commandLength - commandHeaderLength
            tree.connverifyData = buf.toString('ascii', idx, idx + dataLength);
            return idx + dataLength
        case commandTypesEnum.SEND_RELIABLE:
            dataLength = commandLength - commandHeaderLength
            return readMessage(buf, idx, dataLength, tree)
        case commandTypesEnum.FETCH_SERVER_TIMESTAMP:
        case commandTypesEnum.DISCONNECT:
        case 0: // Ignored for now
        case commandTypesEnum.PING: return idx
        default:
            console.log("unrecognized command", command, tree, commandTypes[command]);
            return idx
    }
}

/**
 * A song
 * @typedef {Object} Something
 * @property {any} peerId
 * @property {any} CRCEnabled
 * @property {any} commandCount
 * @property {any} timestamp
 * @property {any} challenge
 * @property {any} commands
 */

/**
 * @param {Buffer} buf
 * @param {Something} tree
 */
const parseIncomming = (buf, tree) => {
    const protoHeaderLen = 12
    tree.peerId = buf.readInt16BE(0);
    tree.CRCEnabled = buf.readUInt8(2)
    tree.commandCount = buf.readUInt8(3)
    tree.timestamp = buf.readUInt32BE(4)
    tree.challenge = buf.readUInt32BE(8)
    let idx = protoHeaderLen

    const cmdCount = tree.commandCount;
    tree.commands = [];
    for (let i = 0; i < cmdCount; i++) {
        // console.log([i, idx])
        tree.commands[i] = { root: tree };
        idx = parseCommand(buf, tree.commands[i], idx);
    }
}

/**
 * @param {Buffer} buf
 */
module.exports.parsePhoton = buf => {
    /** @type {Something} */
    const tree = {};
    parseIncomming(buf, tree);
    // console.log(JSON.stringify(tree, 0, 2))
}

let fragments = {};

const fragmentParser = R.pipe(
    R.values,
    R.sortBy(R.prop('sendfragFragnum')),
    R.map(R.prop('sendfragData')),
    R.join(''),
)

/**
 * @param {Buffer} buf
 * @param {number} idx
 * @param {number} commandLength
 * @param {number} commandHeaderLength
 */
function parseFragmentCommand(tree, buf, idx, commandLength, commandHeaderLength) {
    const commandMetaLength = 20;
    tree.sendfragStartseqnum = buf.readUInt32BE(idx);
    tree.sendfragFragcount = buf.readUInt32BE(idx + 4);
    tree.sendfragFragnum = buf.readUInt32BE(idx + 8);
    tree.sendfragTotallen = buf.readUInt32BE(idx + 12);
    tree.sendfragFragoff = buf.readUInt32BE(idx + 16);
    const sendfrag_fragnum = tree.sendfragFragnum;
    let addLength = 0;
    if (sendfrag_fragnum == 0) {
        tree.customSignature = buf.readUInt8(idx + 20);
        tree.customCommandtype = buf.readUInt8(idx + 21);
        tree.customOpCode = buf.readUInt8(idx + 22);
        tree.customReturnCode = buf.readUInt8(idx + 23);
        tree.customDebugMessage = buf.readUInt8(idx + 24);
        // tree.customDebugMessage = buf.readUInt8(idx + 24);
        // addLength = 5;
    }
    const dataLength = commandLength - commandHeaderLength - commandMetaLength - addLength;
    const start = idx + commandMetaLength + addLength;
    // tree.sendfragData = buf(idx + commandMetaLength + addLength, dataLength)
    tree.sendfragData = buf.toString('hex', start, start + dataLength)

    const fragId = tree.sendfragStartseqnum;
    fragments[fragId] = fragments[fragId] || {};
    const fragmentRef = fragments[fragId];
    fragmentRef[sendfrag_fragnum] = tree;
    if (Object.keys(fragmentRef).length === tree.sendfragFragcount) {
        readMessage(
            Buffer.from(
                fragmentParser(
                    fragmentRef
                ), 'hex'
            ), 0, tree.sendfragTotallen, {}
        )
    }
    return idx + dataLength + commandMetaLength + addLength;
}

/**
 * @param {Buffer} buf
 * @param {{ commandType?: any; channelId?: any; commandFlags?: any; reservedByte?: any; commandLength?: any; relSeqNum?: any; sendunrelUnrelseqnum?: any; }} tree
 * @param {number} idx
 * @param {number} commandLength
 * @param {number} commandHeaderLength
 */
function parseSendUnreliable(tree, buf, idx, commandLength, commandHeaderLength) {
    const commandMetaLength = 4;
    tree.sendunrelUnrelseqnum = buf.readUInt32BE(idx);
    const dataLength = commandLength - commandHeaderLength - commandMetaLength
    return readMessage(buf, idx + commandMetaLength, dataLength, tree)
}


/**
 * @param {Buffer} buf
 * @param {{ commandType?: any; channelId?: any; commandFlags?: any; reservedByte?: any; commandLength?: any; relSeqNum?: any; ackRecvrelseqnum?: any; ackRecvsenttime?: any; }} tree
 * @param {number} idx
 */
function parseAcknowledgement(tree, buf, idx) {
    const commandMetaLength = 8
    tree.ackRecvrelseqnum = buf.readUInt32BE(idx);
    tree.ackRecvsenttime = buf.readUInt32BE(idx + 4);
    return idx + commandMetaLength
}

/**
 * @param {Buffer} buf
 * @param {number} idx
 * @param {number} len
 * @param {{ commandType?: any; channelId?: any; commandFlags?: any; reservedByte?: any; commandLength?: any; relSeqNum?: any; msg?: any; }} root
 */
function readMessage(buf, idx, len, root) {
    // if (root.msg)
    // root.msg = root.msg || [];
    // const tree = root.msg[root.msg.push({}) - 1]
    root.msg = {};
    const tree = root.msg;
    // const tree = root:add(pf_command_msg, len, "Message")
    const headerLength = 2
    tree.commandMsgSignifier = buf.readUInt8(idx)
    tree.commandMsgType = buf.readUInt8(idx + 1)

    //    tree:append_text(string.format(" - %s", msgType_info.display))

    const msgType = tree.commandMsgType
    idx = idx + headerLength
    let dataLength, metaLength, start, result

    // msgType /*? $*/

    switch (msgType) {
        case messageTypesEnum.OPERATION_REQUEST:
            metaLength = 3 - 2 // debug op fix
            dataLength = len - headerLength - metaLength
            tree.commandOpCode = buf.readUInt8(idx)
            tree.commandMsgParametercount = buf.readUInt16BE(idx + 1)
            start = idx + metaLength
            tree.commandMsgParameters = buf.toString('hex', start, start + dataLength)
            result = ({
                type: "OPERATION_REQUEST",
                data: decodeParamsWithDebug(
                    streamConstructor(buf, start), false
                )
            })
            // ins2(result)
            return idx + metaLength + dataLength
        case messageTypesEnum.OPERATION_RESPONSE: case messageTypesEnum.OPERATION_RESPONSE_ALT:
            metaLength = 6 - 1 - 2 // debug op fix
            dataLength = len - headerLength - metaLength
            tree.commandOpCode = buf.readUInt8(idx)
            tree.commandOpReturncode = buf.readUInt16BE(idx + 1)
            tree.commandOpDebug = buf.readUInt8(idx + 3)
            tree.commandMsgParametercount = buf.readUInt16BE(idx + 4)
            start = idx + metaLength
            tree.commandMsgParameters = buf.toString('hex', start, start + dataLength)
            // tree /*? $*/
            result = ({
                type: "OPERATION_RESPONSE",
                data: decodeParamsWithDebug(
                    streamConstructor(buf, start), true
                )
            })
            const OP_TYPE_KEY = 253;
            switch (result.data[OP_TYPE_KEY]) {
                case OPERATION_TYPES.READ_MAIL:
                    receiveMessage(["readMail", parseReadMail(result.data)]);
                    break;
                case OPERATION_TYPES.GET_MAIL_INFOS:
                    receiveMessage(["getMailInfo", parseMailInfo(result.data)])
                    break;
                case OPERATION_TYPES.AUCTION_GET_MY_OPEN_OFFERS:
                case OPERATION_TYPES.AUCTION_GET_FINISHED_AUCTIONS:
                case OPERATION_TYPES.AUCTION_GET_MY_OPEN_REQUESTS:
                    readAuctions(result.data);
                    break;
                // case OPERATION_TYPES
                default: break;
            }
            return idx + metaLength + dataLength
        case messageTypesEnum.EVENT_DATA:
            metaLength = 1
            dataLength = len - headerLength - metaLength
            tree.commandEvCode = buf.readUInt8(idx)
            tree.commandMsgParametercount = buf.readUInt16BE(idx + 1)
            start = idx + metaLength
            tree.commandMsgParameters = buf.toString('hex', start, start + dataLength)
            // ins2(
            //     decodeParamsWithDebug(
            //         streamConstructor(buf, start), false
            //     )
            // )
            return idx + metaLength + dataLength
    }
    return idx
}

const test = false
if (test) {
    /**
     * @type {SpecialJSON}
     */
    // @ts-ignore
    // const p = require("./roundabout.json");
    const p = require("./logs/roundabouts.json");
    // const p = require("./330.json");
    const startOff = 12, length = 10000;
    const packets = p
        // .slice(startOff - 1, startOff + length - 1)
        .filter(x => x._source.layers.data)
        .map(x => x._source.layers.data["data.data"])

    console.log("module.exports.data = [");

    packets
        .map(x => x.replace(/:/g, ''))
        .forEach(x => {
            const b = Buffer.from(x, 'hex');
            module.exports.parsePhoton(b);
        })
    console.log("];\n");
}
