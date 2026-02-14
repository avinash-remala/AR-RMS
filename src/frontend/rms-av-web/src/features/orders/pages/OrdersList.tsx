import { useEffect, useState } from 'react';
import { ordersApi, type Order } from '../api/ordersApi';

function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    loadOrders();
  }, [selectedDate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getAll(selectedDate);
      setOrders(response.data);
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Orders</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ padding: '8px', fontSize: '14px' }}
        />
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ textAlign: 'left', padding: '10px' }}>Order #</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Delivery Date</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Veg</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Non-Veg</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Total</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px' }}>{order.orderNumber}</td>
              <td style={{ padding: '10px' }}>
                {new Date(order.deliveryDate).toLocaleDateString()}
              </td>
              <td style={{ padding: '10px' }}>{order.vegCount}</td>
              <td style={{ padding: '10px' }}>{order.nonVegCount}</td>
              <td style={{ padding: '10px' }}>${order.totalAmount.toFixed(2)}</td>
              <td style={{ padding: '10px' }}>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OrdersList;
