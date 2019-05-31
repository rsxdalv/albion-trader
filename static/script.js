'use strict';

const e = React.createElement;
const css = emotion.css;

const tabId = Math.random();

const viewReq = `/view/${tabId}`;

async function main() {
    // const x = await (await fetch("/table")).text();
    const view = await fetch(viewReq);
    if (view.status === 304) {
        return;
    }
    return await view.json();
}

/** 
 * @typedef {Object} AlbionResponse 
 * @property {Number} Amount 
 * @property {String} BuyerName 
 * @property {Number} Id 
 * @property {String} ItemTypeId 
 * @property {Number} UnitPriceSilver 
 * @property {String} dateTime 
 * @property {Boolean} isGuild 
 * @property {Boolean} isRead 
 * @property {String} itemName 
 * @property {String} location 
 * @property {String} message_type 
 * @property {String} message_type_name 
 * @property {String} senderId 
 */

const n = x => numeral(x).format('0,0');

class LikeButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = { data: [] };
        const refresh = () => {
            main().then(/** @param {any[]} data */ data =>
                !data || R.equals(this.state.data, data) ? void 0 :
                    this.setState({
                        data
                        // R.pipe(R.values,
                        //     // x => x.slice(0, 20),
                        //     R.reverse)(data),
                        // data.reverse() 
                    })
            )
            setTimeout(() => {
                refresh();
            }, 150);
        }
        refresh();
    }

    render() {
        const data = this.state.data;

        const list = e(
            'div',
            {
                key: 1, className: css`
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
            `},
            // { onClick: () => this.setState({ liked: true }) },
            R.pipe(
                R.mapObjIndexed(/** @param {AlbionResponse} x */
                    ({ Id, message_type_name, dateTime, location, Amount, itemName, UnitPriceSilver, BuyerName, ItemTypeId }, key) => {
                        const product = UnitPriceSilver * Amount;
                        const isBuy = message_type_name === "Buy";
                        const total = isBuy ? Math.ceil(product * 1.01) : Math.floor(product * 0.96);
                        const totalExpense = isBuy ? Math.ceil(product * 0.01) : Math.ceil(product * 0.05);
                        const extraLabel = isBuy ? "Fee" : "Fee & Taxes";
                        const totalLabel = isBuy ? "Total - Fee" : "Total + Tax";
                        return e(
                            'div',
                            {
                                key, className: css`
                            background-color: ${isBuy ? "#FA824C" : "#9FD356"};
                            color: #5C573E;
                            border-radius: 3px;
                            padding: 0.3em 1em;
                            display: flex;
                            align-items: center;
                            width: 26em;
                            margin-bottom: 1em;
                            margin-right: 1em;
                        ` },
                            [
                                // e('span', { key: 0 }, Id),
                                e('span', { key: 0, className: css`display: none;` }, Id),
                                e('div', {
                                    key: 1, className: css`
                                display: flex;
                                flex-direction: column;
                                margin-right: 0.8em;
                            ` }, [
                                        e('span', { key: 1, className: css`font-size: 0.7em;` }, `${message_type_name} ${BuyerName && `- ${BuyerName}` || ""}`),
                                        e('span', { key: 2, className: css`` }, location),
                                        e('span', { key: 10, className: css`font-size: 0.8em;` }, moment(new Date(dateTime)).fromNow()),
                                    ]),
                                // https://gameinfo.albiononline.com/api/gameinfo/items/T4_CAPEITEM_FW_FORTSTERLING@3.png?quality=2
                                e('img', { key: 3, src: `https://gameinfo.albiononline.com/api/gameinfo/items/${ItemTypeId || "T1_MAIN_SWORD"}.png`, className: css`width: 4em; height: 4em;` }),
                                e('div', {
                                    key: 4, className: css`
                                    display: flex;
                                    flex-direction: column;
                                ` }, [
                                        e('span', { key: 4, className: css`` }, (Amount && `${Amount} x ${itemName}`) || "-"),
                                        // e('span', { key: 5, className: css`width: 24em;` }, ),
                                        e('div', {
                                            key: 1, className: css`
                                        display: flex;
                                    ` }, [
                                                e('div', {
                                                    key: 1, className: css`
                                                    display: flex;
                                                    flex-direction: column;
                                                    margin-right: 1em;
                                                ` }, [
                                                        e('span', { key: 7, className: css`font-weight: bold; margin-left: -0.07em;` }, `Total: $${n(total) || " -"}`),
                                                        e('span', { key: 6, className: css`font-size: 0.8em;` }, `Unit Price: $${n(UnitPriceSilver) || " -"}`),
                                                    ]),
                                                e('div', {
                                                    key: 2, className: css`
                                                    display: flex;
                                                    flex-direction: column;
                                                ` }, [
                                                        e('span', { key: 8, className: css`` }, `${totalLabel}: $${n(product) || " -"}`),
                                                        e('span', {
                                                            key: 9, className: css`
                                                    font-size: 0.8em;
                                                    margin-left: 0.1em; /* Font asks for alignment */
                                                ` }, `${extraLabel}: $${n(totalExpense) || " -"}`),
                                                    ]),
                                            ]),
                                    ]),
                                // e('span', { key: 6, className: css`` }, `$${TotalAfterTaxes || " -"}`),
                                // e('span', { key: 2 }, anotherId),
                            ]
                        )
                    }),
                R.values,
            )(data)
        );

        const purchases = R.pipe(
            R.values,
            R.filter(R.propEq("message_type_name", "Buy")),
            R.map(R.pipe(
                ({ Amount, UnitPriceSilver }) => (Amount || 0) * (UnitPriceSilver || 0)
            )),
            R.sum,
        )(data)

        const sales = R.pipe(
            R.values,
            R.filter(R.propEq("message_type_name", "Sell")),
            R.map(R.pipe(
                ({ Amount, UnitPriceSilver }) => (Amount || 0) * (UnitPriceSilver || 0)
            )),
            R.sum,
        )(data)

        const overturn = purchases + sales;

        const txCount = R.pipe(
            R.values,
            R.length,
        )(data)

        const itemsCount = R.pipe(
            R.values,
            R.map(R.propOr(0, "Amount")),
            R.sum,
        )(data)

        return e(
            'div',
            {
                key: 0, className: css`
            `},
            [
                e('div', { key: 0, className: css`display: flex; align-items: baseline;` }, [
                    e(
                        'h1',
                        {
                            key: -2, className: css`
                            color: rgba(250, 255, 253, 1);
                            font-size: 2em;
                            font-weight: bold;
                            margin-right: 1em;
                    `},
                        `Albion Market History`
                    ),
                    e(
                        'h2',
                        {
                            key: 0, className: css`
                            color: rgba(250, 255, 253, 1);
                            margin-bottom: 0.3em;
                            font-size: 1.5em;
                            font-weight: 500;
                    `},
                        `Overturn: $${n(overturn)} Sales: $${n(sales)} Purchases: $${n(purchases)} Transactions: ${n(txCount)} Items: ${n(itemsCount)}`
                    ),
                    e(
                        'button',
                        {
                            onClick: () => {
                                fetch("/shutdown").then(() => window.close())
                            },
                            key: -1, className: css`
                            color: rgba(250, 255, 253, 1);
                            font-size: 2em;
                            font-weight: bold;
                            margin-left: 1em;
                            margin-right: 1em;
                            font-family: inherit;

                            font-size: 100%;
                            padding: .5em 1em;
                            color: #444;
                            color: rgba(0,0,0,.8);
                            border: 1px solid #999;
                            border: transparent;
                            background-color: #E6E6E6;
                            text-decoration: none;
                            border-radius: 2px;

                            display: inline-block;
                            zoom: 1;
                            white-space: nowrap;
                            vertical-align: middle;
                            text-align: center;
                            cursor: pointer;
                            -webkit-user-drag: none;
                            -webkit-user-select: none;
                            -moz-user-select: none;
                            -ms-user-select: none;
                            user-select: none;

                            :hover, :focus {
                                filter: alpha(opacity=90);
                                background-image: -webkit-linear-gradient(transparent,rgba(0,0,0,.05) 40%,rgba(0,0,0,.1));
                                background-image: linear-gradient(transparent,rgba(0,0,0,.05) 40%,rgba(0,0,0,.1));
                            }
                    `},
                        `Shutdown App`
                    ),
                ]),
                list,
            ]
        );
    }
}

const domContainer = document.querySelector('#app');
ReactDOM.render(e(LikeButton), domContainer);
