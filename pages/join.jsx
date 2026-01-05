// Replace the existing submitJoin implementation with this:
async function submitJoin(e) {
  e && e.preventDefault();
  setStatusMsg('');
  const trimmedCode = (code || '').trim();
  if (!trimmedCode) {
    setStatusMsg('Please enter the invite code.');
    return;
  }

  const payload = {
    code: trimmedCode,
    name: (name || '').trim() || null,
    email: (email || '').trim() || null,
  };

  // If user is signed in, get idToken and pass it to the server for uid attachment
  let idToken = null;
  try {
    if (authRef.current && authModRef.current && authRef.current.currentUser) {
      idToken = await authRef.current.currentUser.getIdToken();
    }
  } catch (err) {
    console.warn('Could not get idToken', err);
  }

  try {
    const resp = await fetch('/api/joins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...payload, idToken }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      setStatusMsg(data.error || 'Failed to register join.');
      // fallback to local record so user doesn't lose form data
      saveLocalJoin(payload);
      setJoined(true);
      return;
    }
    // success
    saveLocalJoin(payload);
    setJoined(true);
    setStatusMsg('Welcome — your join has been recorded.');
  } catch (err) {
    console.error('Join API error', err);
    // fallback local save
    saveLocalJoin(payload);
    setJoined(true);
    setStatusMsg('Join recorded locally (server error).');
  }
}
