import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // In production, get user from authenticated session
    // const { user } = await supabase.auth.getUser();
    const userId = 'demo-user-123'; // Replace with user.id in production

    // Get latest financial data for the user
    const { data, error } = await supabase
      .from('financial_data')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error('Error fetching financial data:', error);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    if (!data) {
      return res.status(404).json({ message: 'No financial data found' });
    }

    // Return the financial data
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return res.status(500).json({ error: 'Failed to fetch financial data' });
  }
} 