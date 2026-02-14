import { useEffect, useState } from 'react';
import { companiesApi, type Company } from '../api/companiesApi';

function CompaniesList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await companiesApi.getAll();
      setCompanies(response.data);
    } catch (err) {
      setError('Failed to load companies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Companies</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Contact Person</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Phone</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px' }}>{company.name}</td>
              <td style={{ padding: '10px' }}>{company.contactPerson}</td>
              <td style={{ padding: '10px' }}>{company.contactEmail}</td>
              <td style={{ padding: '10px' }}>{company.contactPhone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CompaniesList;
