import { useState, useEffect } from 'react';

export const useGraphData = () => {
  const [data, setData] = useState<{ entityCsv: string; relationshipCsv: string; loading: boolean }>({
    entityCsv: '',
    relationshipCsv: '',
    loading: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [entityRes, relRes] = await Promise.all([
          fetch('/data/entity_v3_260127.csv'),
          fetch('/data/relationship_v3_260127.csv')
        ]);

        if (!entityRes.ok || !relRes.ok) {
           throw new Error('Failed to fetch CSVs');
        }

        const entityCsv = await entityRes.text();
        const relationshipCsv = await relRes.text();

        setData({ entityCsv, relationshipCsv, loading: false });
      } catch (error) {
        console.error('Error loading graph data:', error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, []);

  return data;
};
