module.exports.bytesToGuid = x => {
    const hexArray = x
        .slice(0, 4)
        .reverse()
        .concat(x
            .slice(4, 6)
            .reverse()
        )
        .concat(x
            .slice(6, 8)
            .reverse()
        )
        .concat(x
            .slice(8)
        )
        .map(item => ('00' + item.toString(16)).substr(-2, 2))
    const hexSlice = (x, y) => hexArray.slice(x, y).join('')
    return `${hexSlice(0, 4)}-${hexSlice(4, 6)}-${hexSlice(6, 8)}-${hexSlice(8, 10)}-${hexSlice(10)}`;
}

const test = false
if (test) {
    const res = "d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a";
    const src = [55, 31, 251, 217, 111, 221, 44, 66, 142, 233, 201, 205, 123, 205, 52, 74]
    bytesToGuid(src) /*?*/
    // d9fb1f37-dd6f-422c-8ee9-c9cd7bcd344a
}