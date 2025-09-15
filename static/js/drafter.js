document.addEventListener('DOMContentLoaded', () => {
    const draftForm = document.getElementById('draft-form');
    const draftBtn = document.getElementById('draft-btn');
    const draftOutput = document.getElementById('draft-output');
    
    draftForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const country = document.getElementById('doc-country-selector').value;
        const doc_type = document.getElementById('doc-type').value;
        const details = document.getElementById('doc-details').value.trim();

        if (details === '') {
            draftOutput.innerText = 'Please provide the key details for the document.';
            return;
        }

        draftBtn.disabled = true;
        draftOutput.innerText = 'Generating your document, please wait...';
        
        try {
            const response = await fetch('/api/draft-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ country, doc_type, details }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                draftOutput.innerText = `Error: ${errorData.error || 'Failed to generate draft.'}`;
                return;
            }

            const data = await response.json();
            draftOutput.innerText = data.draft;

        } catch (error) {
            draftOutput.innerText = 'An error occurred while connecting to the server.';
        } finally {
            draftBtn.disabled = false;
        }
    });
});