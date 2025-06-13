import express from 'express';
import { supabase } from '../supabaseClient.js';
import twilio from 'twilio';

const router = express.Router();

// Replace this with your actual Twilio SMS-capable number (e.g., +1234567890)
const accountSid = 'AC7f0702f41f80d844f0fd37c863479c3e';
const authToken = '5c803ee81c43b895b329a43547de7bcb';
const fromSMSNumber = '+14789991119'; // ✅ <-- your Twilio phone number here
const client = twilio(accountSid, authToken);

router.post('/', async (req, res) => {
    const { event_id } = req.body;

    if (!event_id) {
        return res.status(400).json({ error: "Missing event_id" });
    }

    try {
        // 1. Get event details
        const { data: event, error: eventError } = await supabase
            .from('event_table')
            .select('event_name, event_date, event_time')
            .eq('id', event_id)
            .single();

        if (eventError || !event) {
            return res.status(500).json({ error: "Failed to fetch event" });
        }

        // 2. Get contact_ids linked to this event
        const { data: notifications, error: notifError } = await supabase
            .from('notifications_table')
            .select('contact_id')
            .eq('event_id', event_id);

        if (notifError) {
            return res.status(500).json({ error: "Failed to fetch notifications" });
        }

        const contactIds = notifications.map(n => n.contact_id);
        if (contactIds.length === 0) {
            return res.status(400).json({ error: "No contacts linked to this event" });
        }

        // 3. Fetch contact phone numbers
        const { data: contacts, error: contactsError } = await supabase
            .from('contacts_table')
            .select('id, phone')
            .in('id', contactIds);

        if (contactsError) {
            return res.status(500).json({ error: "Failed to fetch contacts" });
        }

        // 4. Send SMS messages
        const messageBody = `📅 Reminder: "${event.event_name}" on ${event.event_date} at ${event.event_time}`;
        const results = await Promise.all(
            contacts.map(async (contact) => {
                try {
                    await client.messages.create({
                        body: messageBody,
                        from: fromSMSNumber, // ✅ SMS number
                        to: contact.phone     // ✅ No whatsapp: prefix
                    });
                    return { to: contact.phone, status: 'sent' };
                } catch (twilioErr) {
                    return { to: contact.phone, status: 'failed', error: twilioErr.message };
                }
            })
        );

        return res.json({ success: true, results });

    } catch (err) {
        console.error("Unhandled error:", err.message);
        return res.status(500).json({ error: "Unexpected server error" });
    }
});

export default router;
