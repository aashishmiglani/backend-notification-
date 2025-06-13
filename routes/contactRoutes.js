import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// CREATE CONTACT (no event_id required)
router.post('/', async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const { data, error } = await supabase
            .from('contacts_table')
            .insert([{ name, phone }])
            .select();

        if (error) {
            console.error("❌ Supabase insert error:", error.message);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, data });
    } catch (err) {
        console.error("🔥 Server crash:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// READ ALL CONTACTS
// READ ALL CONTACTS with optional search
router.get('/', async (req, res) => {
    const { search } = req.query;

    try {
        let query = supabase
            .from('contacts_table')
            .select('*');

        if (search && search.trim() !== '') {
            query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        const { data, error } = await query.order('name', { ascending: true });

        if (error) return res.status(500).json({ error: error.message });

        res.json({ success: true, data });
    } catch (err) {
        console.error("🔥 Server crash during search:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// READ SINGLE CONTACT
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
        .from('contacts_table')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return res.status(404).json({ error: "Contact not found" });
    res.json({ success: true, data });
});

// UPDATE CONTACT
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, phone } = req.body;

    const { data, error } = await supabase
        .from('contacts_table')
        .update({ name, phone })
        .eq('id', id)
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
});

// DELETE CONTACT
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('contacts_table')
        .delete()
        .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, message: "Contact deleted" });
});

export default router;
