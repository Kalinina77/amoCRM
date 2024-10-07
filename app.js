const accessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6Ijc5MzA3NjdkYjA0MTFhNmJkM2MwNzhkMGFmNzU3N2NjNmUxM2I3YmFkM2QwYTkyMDIxMjZiOTIxNWEyY2YwYmFlZDEzYjQ3YjZlYWU1MmUyIn0.eyJhdWQiOiIxOTA5NzQ2ZC0zNWU5LTQ2ZGQtOGQ5My03OTE0ZTA1OTA1NzQiLCJqdGkiOiI3OTMwNzY3ZGIwNDExYTZiZDNjMDc4ZDBhZjc1NzdjYzZlMTNiN2JhZDNkMGE5MjAyMTI2YjkyMTVhMmNmMGJhZWQxM2I0N2I2ZWFlNTJlMiIsImlhdCI6MTcyODI5NTc5MSwibmJmIjoxNzI4Mjk1NzkxLCJleHAiOjE3MzU4NjI0MDAsInN1YiI6IjExNjE0NzcwIiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMxOTkzNzI2LCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiYmU0MDQ1NjEtODM2Ny00ZDM1LWFmZDItYjY0NzBiODcwNWI3IiwiYXBpX2RvbWFpbiI6ImFwaS1iLmFtb2NybS5ydSJ9.GZbsWVP32_bOEJbtFqGSXsCFfhQtE3iuy7-IwiyORP4Ed5Uj7_tuP_ysWDBEN0MD0n9PMEjDcjn6GNBROyqYMe-MVlS2ze4nJ45zFMVA6WV7MXc2QM8uHkglqv5_EuOv9ZSMGi4nFCwAgW8nk_z9DYixXFCorhqFMcFIwPCgU3MhKcTWxxrbFQ06LFBr7K8kKEUF5rOUyeOPrgbO4rwSefx3NHvBPSV0_hugwyji9kcXlu7VoRZpv2_XsFncENq699Il6zKOi_ZHSdvECH-F_ovXl3CFNlhohPPsFIFwVudjxZ5Is4tY_Hn7Wd4IRo7lJw235OIUfm-qln8Mm6G8bg';

const dealsTable = document.getElementById('deals-table');
let isLoading = false;
let currentPage = 1;  
const limit = 3;  
const loadedDeals = new Set();  
let openedRow = null; 

async function fetchDeals() {
    if (isLoading) return;

    isLoading = true;

    try {
        const response = await fetch(`https://shura8898.amocrm.ru/api/v4/leads?page=${currentPage}&limit=${limit}`, {
            headers: new Headers({
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Ошибка: ${response.status} - ${response.statusText}`);
            console.error(`Тело ответа: ${errorText}`);
            return;
        }

        const data = await response.json();
        displayDeals(data._embedded.leads);

        if (data._embedded.leads.length === limit) {
            currentPage++;
        } else {
            console.log('Все сделки загружены');
        }
    } catch (error) {
        console.error('Ошибка при получении сделок:', error);
    } finally {
        isLoading = false;
    }
}

function displayDeals(deals) {
    deals.forEach(deal => {
        if (!loadedDeals.has(deal.id)) {  
            loadedDeals.add(deal.id);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${deal.id}</td>
                <td class="deal-title" data-id="${deal.id}">${deal.name}</td>
                <td>${deal.price || 'Нет данных'}</td>
            `;

            row.dataset.id = deal.id;
            row.dataset.name = deal.name;
            row.dataset.price = deal.price || 'Нет данных';

            row.addEventListener('click', () => handleRowClick(deal.id, row));

            dealsTable.appendChild(row);
        }
    });
}

function handleRowClick(dealId, row) {
    if (openedRow && openedRow !== row) {
        openedRow.innerHTML = `
            <td>${openedRow.dataset.id}</td>
            <td>${openedRow.dataset.name}</td>
            <td>${openedRow.dataset.price}</td>
        `;
    }

    if (openedRow === row) {
        openedRow = null;  
    } else {
        loadDealDetails(dealId, row);
        openedRow = row;
    }
}

async function loadDealDetails(dealId, row) {
    row.innerHTML = '<td colspan="3" class="loading">Загрузка...</td>';

    try {
        const response = await fetch(`https://shura8898.amocrm.ru/api/v4/leads/${dealId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Ошибка: ${response.status} - ${response.statusText}`);
            console.error(`Тело ответа: ${errorText}`);
            return;
        }

        const deal = await response.json();
        displayDealDetails(deal, row);
    } catch (error) {
        console.error('Ошибка при получении деталей сделки:', error);
    }
}

function displayDealDetails(deal, row) {
    const taskDueDate = formatTaskDueDate(deal.closest_task_at);
    const statusColor = getTaskStatusColor(deal.closest_task_at);
    const extraInfoColumns = document.querySelectorAll('.info');
    extraInfoColumns.forEach(col => col.classList.remove('hidden'));
    const extraInfoColumns2 = document.querySelectorAll('.info-2');
    extraInfoColumns2.forEach(col => col.classList.add('hidden'));
    row.innerHTML = `
        <td>${deal.id}</td>
        <td>${taskDueDate}</td>
        <td>
            <svg height="20" width="20">
                <circle cx="10" cy="10" r="8" stroke="black" stroke-width="1" fill="${statusColor}" />
            </svg>
        </td>
    `;
}

function formatTaskDueDate(closestTaskAt) {
    if (!closestTaskAt) {
        return 'Нет задач';
    }

    const dueDate = new Date(closestTaskAt * 1000); 
    return dueDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC'  
    });
}

function getTaskStatusColor(closestTaskAt) {
    if (!closestTaskAt) {
        return 'red';
    }

    const taskDate = new Date(closestTaskAt * 1000);  
    const today = new Date();  
    
    const taskDay = new Date(taskDate.getUTCFullYear(), taskDate.getUTCMonth(), taskDate.getUTCDate());
    const todayDay = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

    if (taskDay.getTime() === todayDay.getTime()) {
        return 'green';
    }
    else if (taskDay < todayDay) {
        return 'red';
    }
    else {
        return 'yellow';
    }
}

function fetchDealsWithDelay() {
    fetchDeals(); 

    setInterval(() => {
        fetchDeals();
    }, 5000);  
}

fetchDealsWithDelay();