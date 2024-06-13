import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const HTTP_ENDPOINT = 'https://potential-robot-jjj6j66p5vpw3vv7-4000.app.github.dev';
const WS_ENDPOINT = 'wss://potential-robot-jjj6j66p5vpw3vv7-4000.app.github.dev/ws';

function App() {
    const formatPrice = (price) => {
        return Number(price).toLocaleString('es-ES');
    };

    const getColor = (type) => {
        switch (type) {
            case 'Buys':
                return 'blue';
            case 'Incomes':
                return 'green';
            case 'Expenses':
                return '#ff5100';
            case 'Debts':
                return '#c90202';
            default:
                return 'black';
        }
    };

    const [inputData, setInputData] = useState({
        description: '',
        price: '',
        date: '',
        importance: '',
        type: '',
        category: '',
        ready: '',
        deadline: ''
    });
    
    const [transactions, setTransactions] = useState([]);

    const isInitialLoad = useRef(true);
    const wsRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${HTTP_ENDPOINT}/transactions`);
                const uniqueTransactions = getUniqueTransactions(response.data);
                setTransactions(uniqueTransactions);
                isInitialLoad.current = false;
            } catch (error) {
                console.error('Error fetching transactions', error);
            }
        };
        fetchData();
        
        wsRef.current = new WebSocket(WS_ENDPOINT);

        wsRef.current.onopen = () => {
            console.log('WebSocket connected');
        };

        wsRef.current.onmessage = (message) => {
            try {
                const data = JSON.parse(message.data);
                if (!isInitialLoad.current) {
                    setTransactions((prevTransactions) => {
                        const newTransactions = getUniqueTransactions([...prevTransactions, data]);
                        return newTransactions;
                    });
                }
            } catch (error) {
                console.error('Error parsing JSON data:', error);
            }
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const getUniqueTransactions = (transactionsArray) => {
        const seen = new Set();
        return transactionsArray.filter(transaction => {
            const transactionString = JSON.stringify(transaction);
            return seen.has(transactionString) ? false : seen.add(transactionString);
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'price') {
            const formattedPrice = value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            setInputData((prevInputData) => ({
                ...prevInputData,
                [name]: formattedPrice
            }));
        } else {
            setInputData((prevInputData) => ({
                ...prevInputData,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const inputDataCopy = { ...inputData, price: inputData.price.replace(/\./g, '') };

        try {
            const response = await axios.post(`${HTTP_ENDPOINT}/add_transactions`, inputDataCopy);
            const newTransaction = response.data;
            setTransactions((prevTransactions) => {
                const newTransactions = getUniqueTransactions([...prevTransactions, newTransaction]);
                return newTransactions;
            });
            setInputData({
                description: '',
                price: '',
                date: '',
                importance: '',
                type: '',
                category: '',
                ready: '',
                deadline: ''
            });
        } catch (error) {
            console.error('Error inserting transaction', error);
            alert('Error inserting transaction. Please check your data and try again.');
        }
    };

    return (
        <div id="container" style={{ background: '#333', display: 'flex', flexDirection: 'flex', gap: '5%', alignItems: 'start', justifyContent: 'center', padding: '0%' }}>
            <div id="content">
                <div id="results" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gridTemplateRows: '5% 1fr 1fr 1fr', gap: '3%', alignItems: 'start', justifyContent: 'center' }} className="results">
                    <form id="form-principal" style={{ gridColumn: '1', gridRow: '1 / -1' }} onSubmit={handleSubmit} >
                        <h1 style={{ color: '#fff' }}>Transacciones</h1>
                        <div id="form-home">
                            <input type="text" name="description" value={inputData.description} onChange={handleChange} placeholder="Description" />
                            <input type="text" name="price" value={inputData.price} onChange={handleChange} placeholder="Price" />
                            <input type="text" name="date" value={inputData.date} onChange={handleChange} placeholder="Date (YYYY-MM-DD)" />
                            <input type="text" name="importance" value={inputData.importance} onChange={handleChange} placeholder="Importance (Alta/Media/Baja)" />
                            <input type="text" name="type" value={inputData.type} onChange={handleChange} placeholder="Type" />
                            <input type="text" name="category" value={inputData.category} onChange={handleChange} placeholder="Category" />
                            <input type="number" name="ready" value={inputData.ready} onChange={handleChange} placeholder="Ready (true/false)" />
                            <input type="text" name="deadline" value={inputData.deadline} onChange={handleChange} placeholder="Deadline (YYYY-MM-DD)" />
                            <div id="button-submit" style={{ width: '100%' }}><button type="submit">Insert Transaction</button></div>
                        </div>
                    </form>
                    <div style={{gridColumn: '2 / -1', gridRow:'1 / -1',display: 'grid', gridTemplateColumns:'1fr 1fr 1fr', gridTemplateRows:'7% 1fr 1fr 1fr', padding:'2%'}}>
                        <div style={{background:'white', color:'black', height:'80%',textAlign:'center', gridRow:'1', gridColumn:'3', marginLeft: '5%'}}><h4>Total</h4></div>
                        <div id="buys-container" style={{gridRow:'2', gridColumn:'1/ 3'}}>
                            {transactions.filter(transaction => transaction.type === 'Buys').map((transaction, index) => (
                                <div key={index} style={{ background: getColor(transaction.type), padding: '2%', margin: '5%' }}>
                                    <div><h6>${formatPrice(transaction.price)}</h6></div>
                                    <div><p>{transaction.description}</p></div>
                                </div>
                            ))}
                        </div>
                        <div id="incomes-container" style={{gridRow:'2', gridColumn:'3'}}>
                            {transactions.filter(transaction => transaction.type === 'Incomes').map((transaction, index) => (
                                <div key={index} style={{ background: getColor(transaction.type), padding: '2%', margin: '5%' }}>
                                    <div><h6>${formatPrice(transaction.price)}</h6></div>
                                    <div><p>{transaction.description}</p></div>
                                </div>
                            ))}
                        </div>
                        <div id="expenses-container" style={{gridRow:'3', gridColumn:'3'}}>
                            {transactions.filter(transaction => transaction.type === 'Expenses').map((transaction, index) => (
                                <div key={index} style={{ background: getColor(transaction.type), padding: '2%', margin: '5%' }}>
                                    <div><h6>${formatPrice(transaction.price)}</h6></div>
                                    <div><p>{transaction.description}</p></div>
                                </div>
                            ))}
                        </div>
                        <div id="debts-container" style={{gridRow:'3', gridColumn:'1/3'}}>
                            {transactions.filter(transaction => transaction.type === 'Debts').map((transaction, index) => (
                                <div key={index} style={{ background: getColor(transaction.type), padding: '2%', margin: '5%' }}>
                                    <div><h6>${formatPrice(transaction.price)}</h6></div>
                                    <div><p>{transaction.description}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
