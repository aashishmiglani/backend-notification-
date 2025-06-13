import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// CREATE
// ✅ POST - Create new event
router.post('/', async (req, res) => {
    const { event_name, event_date, event_time } = req.body;

    console.log("📦 Incoming request body:", { event_name, event_date, event_time });

    // Check if fields are present
    if (!event_name || !event_date || !event_time) {
        return res.status(400).json({ error: "event_name, event_date, and event_time are required" });
    }

    // ✅ Make sure time is passed as 'HH:MM:SS'
    const formattedTime = event_time.length === 5 ? `${event_time}:00` : event_time;

    try {
        const { data, error } = await supabase
            .from('event_table') // ✅ Use your correct table name
            .insert([{
                event_name,
                event_date, // format YYYY-MM-DD
                event_time: formattedTime // format HH:MM:SS
            }])
            .select();

        if (error) {
            console.error("❌ Supabase insert error:", error.message);
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json({ success: true, data });
    } catch (err) {
        console.error("❌ Unexpected error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// READ ALL
router.get('/', async (req, res) => {
    const { data, error } = await supabase
        .from('event_table')
        .select('*');

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
});

// SEARCH by event_name (partial match, case-insensitive)
router.get('/search/:query', async (req, res) => {
    const { query } = req.params;

    try {
        const { data, error } = await supabase
            .from('event_table')
            .select('*')
            .ilike('event_name', `%${query}%`); // case-insensitive LIKE

        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true, data });
    } catch (err) {
        console.error("❌ Search error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});


// READ SINGLE
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('event_table')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, data });
});

// UPDATE
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { event_name, event_date, event_time } = req.body || {};

    const { data, error } = await supabase
        .from('event_table')
        .update({
            event_name,
            event_date,
            event_time,
        })
        .eq('id', id)
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
});

// DELETE
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('event_table')
        .delete()
        .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, message: 'Event deleted' });
});

export default router;








