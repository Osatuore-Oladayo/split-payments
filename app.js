// require a package to use
const express = require("express");

// creating the express app object
const app = express();

// accept json request
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => res.send("Hello world"));

app.post('/split-payments/compute', (req, res) => {
    const { ID, Amount, SplitInfo } = req.body;

    const numObjs = SplitInfo.length;
     
    // splitInfo should be between 1 and 20.
    if ((numObjs < 1) || (numObjs > 20)) {
        return res.status(401).json({
            status: 'error',
            message: 'The splitInfo should contain between 1 and 20 objects'
        })
    }

    // result object
    const result = {
        ID,
        Balance: Amount,
        SplitBreakdown: []
    }

    const SplitInfoObject = {};

    const types = SplitInfo.map((elem) => {
        return elem.SplitType + ':' + elem.SplitEntityId;
    })
    
    types.sort()

    let totalRatio = 0;

    SplitInfo.forEach((prop) => {
        SplitInfoObject[prop.SplitEntityId] = prop;

        if (prop.SplitType === 'RATIO') {
            totalRatio += prop.SplitValue
        }
    })

    
    types.forEach((type_Id) => {
        const t_Id = type_Id.split(':');

        const SplitType = t_Id[0];
        const SplitEntityId = t_Id[1];
        const elm = SplitInfoObject[SplitEntityId];

        // recording the split breakdown

        let Amount;

        // calculation
        if (SplitType === 'FLAT') {
            Amount = elm.SplitValue;
            result.Balance = result.Balance - Amount
        } else if (SplitType === 'PERCENTAGE') {
            Amount = elm.SplitValue / 100 * result.Balance;
            result.Balance = result.Balance - Amount;
        } else {
            Amount = elm.SplitValue / totalRatio * result.Balance;
            result.Balance = result.Balance - Amount;
        }

        result.SplitBreakdown.push({
            SplitEntityId,
            Amount
        })


    })
    // Balance should not be less than 0
    if (result.Balance < 0) {
        return res.status(401).json({
            status: 'error',
            message: 'The Balance should not be less than zero'
        })
    }

    res.json(result);
});

app.listen(process.env.PORT, () => {
    console.log("Server is listening at port 8000");
});

