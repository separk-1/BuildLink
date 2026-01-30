import { useState, useEffect } from 'react';

export const useGraphData = () => {
  const [data, setData] = useState<{ entityCsv: string; relationshipCsv: string; procedureCsv: string; loading: boolean }>({
    entityCsv: '',
    relationshipCsv: '',
    procedureCsv: '',
    loading: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [entityRes, relRes, procRes] = await Promise.all([
          fetch('/data/entity.csv'),
          fetch('/data/relationship.csv'),
          fetch('/data/procedure.csv')
        ]);

        if (!entityRes.ok || !relRes.ok) {
           console.error('Failed to fetch main CSVs');
        }

        const entityCsv = await entityRes.text();
        const relationshipCsv = await relRes.text();
        // procedure.csv might not exist yet or fail, handle gracefully if needed, but assuming it exists
        const procedureCsv = procRes.ok ? await procRes.text() : '';

        setData({ entityCsv, relationshipCsv, procedureCsv, loading: false });
      } catch (error) {
        console.error('Error loading graph data:', error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, []);

  return data;
};
