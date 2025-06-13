import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// CREATE relation between a contact and event (supports is_selected)
router.post('/', async (req, res) => {
    const { contact_id, event_id, is_selected = false } = req.body;

    if (!contact_id || !event_id) {
        return res.status(400).json({ error: "Missing contact_id or event_id" });
    }

    const { data, error } = await supabase
        .from('notifications_table')
        .insert([{ contact_id, event_id, is_selected }])
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
});

// POST multiple contact-event pairs at once (supports is_selected per item)
router.post('/bulk', async (req, res) => {
    const entries = req.body; // array of { contact_id, event_id, is_selected? }

    if (!Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ error: "Invalid input: expected array" });
    }

    const cleanEntries = entries.map(entry => ({
        ...entry,
        is_selected: entry.is_selected ?? false,
    }));

    const { data, error } = await supabase
        .from('notifications_table')
        .insert(cleanEntries)
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
});

// GET all notifications
router.get('/', async (req, res) => {
    const { data, error } = await supabase
        .from('notifications_table')
        .select('*');

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
});

// GET all contacts and mark if they are selected for the event
router.get('/event/:event_id', async (req, res) => {
    const { event_id } = req.params;

    try {
        const { data: allContacts, error: contactError } = await supabase
            .from('contacts_table')
            .select('id, name, phone');

        if (contactError) throw contactError;

        const { data: selectedContacts, error: selectionError } = await supabase
            .from('notifications_table')
            .select('contact_id')
            .eq('event_id', event_id);

        if (selectionError) throw selectionError;

        const selectedIds = new Set(selectedContacts.map(sc => sc.contact_id));

        const combined = allContacts.map(contact => ({
            ...contact,
            is_selected: selectedIds.has(contact.id),
        }));

        res.json({ success: true, data: combined });
    } catch (err) {
        console.error("🔥 Fetch error:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});



// GET all contacts for a given event
router.get('/event/:event_id', async (req, res) => {
    const { event_id } = req.params;

    const { data, error } = await supabase
        .from('notifications_table')
        .select('*, contacts(name, phone)')
        .eq('event_id', event_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
});

// GET all events for a given contact
router.get('/contact/:contact_id', async (req, res) => {
    const { contact_id } = req.params;

    const { data, error } = await supabase
        .from('notifications_table')
        .select('*, notification_ashram(event_name, event_time)')
        .eq('contact_id', contact_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
});

// DELETE a contact-event relation
router.delete('/', async (req, res) => {
    const { contact_id, event_id } = req.body;

    const { error } = await supabase
        .from('notifications_table')
        .delete()
        .eq('contact_id', contact_id)
        .eq('event_id', event_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, message: "Notification relation deleted" });
});

// DELETE /api/notifications/:id
router.delete('/notifications/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('notifications_table').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Deleted successfully' });
});

// DELETE a contact-event relation (deselect contact from event)
router.delete('/deselect', async (req, res) => {
    const { contact_id, event_id } = req.body;

    if (!contact_id || !event_id) {
        return res.status(400).json({ error: "Missing contact_id or event_id" });
    }

    const { error } = await supabase
        .from('notifications_table')
        .delete()
        .eq('contact_id', contact_id)
        .eq('event_id', event_id);

    if (error) {
        console.error("❌ Failed to remove notification link:", error.message);
        return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, message: "Contact deselected for this event" });
});

export default router;
