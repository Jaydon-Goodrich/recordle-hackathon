const express = require('express');
const path = require('path');
require('dotenv').config()
const { Deepgram } = require('@deepgram/sdk')
const DG_KEY = process.env.DG_API_KEY
const deepgram = new Deepgram(DG_KEY)

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/key', async (req, res) => {
	const { key, api_key_id } = await deepgram.keys.create(
		process.env.PROJECT_ID,
		'Temporary user key',
		['usage:write']
	)
	res.json({ key, api_key_id })
})

app.delete('/key/:keyId', async (req, res) => {
	const result = await deepgram.keys.delete(process.env.PROJECT_ID, req.params.keyId)
	res.json(result)
})


app.listen(PORT, () => console.log('Now listening on PORT', PORT));