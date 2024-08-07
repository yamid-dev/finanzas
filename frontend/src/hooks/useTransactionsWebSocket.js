import { useEffect } from 'react';
import axios from 'axios';
import { WS_ENDPOINT, HTTP_ENDPOINT } from '../config/endpoints';

const useTransactionsWebSocket = (setTransactions, isInitialLoad, wsRef, getUniqueTransactions, selectedMonth) => {
    useEffect(() => {
        const fetchData = async () => {
            try {
                const endpoint = selectedMonth !== "0" ? `${HTTP_ENDPOINT}/transactions/${selectedMonth}` : `${HTTP_ENDPOINT}/transactions`;
                const response = await axios.get(endpoint);
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
                    if (data.action === 'add') {
                        setTransactions((prevTransactions) => getUniqueTransactions([...prevTransactions, data.transaction]));
                    } else if (data.action === 'delete') {
                        setTransactions((prevTransactions) => prevTransactions.filter(transaction => transaction.id !== data.transaction.id));
                    } else if (data.action === 'edit') {
                        setTransactions((prevTransactions) =>
                            prevTransactions.map(transaction =>
                                transaction.id === data.transaction.id ? data.transaction : transaction
                            )
                        );
                    }
                }
            } catch (error) {
                console.error('Error parsing JSON data:', error);
            }
        };

        wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [setTransactions, isInitialLoad, wsRef, selectedMonth, getUniqueTransactions]);
};

export default useTransactionsWebSocket;
