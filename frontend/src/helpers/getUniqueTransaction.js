const getUniqueTransaction = (transactionsArray) => {
    const seen = new Set();
    return transactionsArray.filter(transaction => {
        const transactionString = JSON.stringify(transaction);
        return seen.has(transactionString) ? false : seen.add(transactionString);
    });
};

export default getUniqueTransaction;