/**
 * CALCULADORA DE SUBREDES - SCRIPT PRINCIPAL
 * 
 * Este script contiene la lógica para calcular subredes IP
 * y mostrar los resultados en una tabla interactiva.
 */

document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculateBtn');
    const exportBtn = document.getElementById('exportBtn');
    const resultsSection = document.getElementById('resultsSection');
    const subnetsTableBody = document.getElementById('subnetsTableBody');
    const summaryDiv = document.getElementById('summary');
    
    calculateBtn.addEventListener('click', calculateSubnets);
    exportBtn.addEventListener('click', exportToCSV);
    
    function calculateSubnets() {
        let baseNetwork = document.getElementById('baseNetwork').value.trim();
        const subnetsNeeded = parseInt(document.getElementById('subnetsNeeded').value);

        // Si no se especifica máscara CIDR, asignar /24 por defecto
        if (!baseNetwork.includes('/')) {
            baseNetwork += '/24';
        }

        // Validar la red ingresada
        if (!isValidNetwork(baseNetwork)) {
            alert('Por favor, ingresa una red válida (ej: 192.168.1.0 o 192.168.1.0/24)');
            return;
        }

        // Validar el número de subredes
        if (isNaN(subnetsNeeded) || subnetsNeeded < 1) {
            alert('Por favor, ingresa un número válido de subredes (mayor que 0)');
            return;
        }

        // Separar IP y CIDR
        const [ip, cidr] = baseNetwork.split('/');
        const cidrValue = parseInt(cidr);
        const ipBytes = ip.split('.').map(Number);

        const totalIPs = Math.pow(2, 32 - cidrValue);
        const usableIPs = totalIPs - 2;

        // Calcular bits para subredes
        const bitsForSubnets = Math.ceil(Math.log2(subnetsNeeded));
        const newCidr = cidrValue + bitsForSubnets;

        // Validar límites
        if (newCidr > 30) {
            alert('Demasiadas subredes solicitadas. Intenta con un número menor.');
            return;
        }

        const subnetSize = Math.pow(2, 32 - newCidr);
        const hostsPerSubnet = subnetSize - 2;

        updateSummary(baseNetwork, subnetsNeeded, bitsForSubnets, newCidr, hostsPerSubnet);
        generateSubnetsTable(ipBytes, bitsForSubnets, subnetSize, newCidr, hostsPerSubnet);

        resultsSection.style.display = 'block';
    }

    function updateSummary(baseNetwork, subnetsNeeded, bitsForSubnets, newCidr, hostsPerSubnet) {
        summaryDiv.innerHTML = `
            <p><strong>Red Base:</strong> ${baseNetwork}</p>
            <p><strong>Subredes Solicitadas:</strong> ${subnetsNeeded}</p>
            <p><strong>Subredes Creadas:</strong> ${Math.pow(2, bitsForSubnets)}</p>
            <p><strong>Nueva Máscara:</strong> /${newCidr} (${cidrToMask(newCidr)})</p>
            <p><strong>Hosts por Subred:</strong> ${hostsPerSubnet}</p>
        `;
    }

    function generateSubnetsTable(ipBytes, bitsForSubnets, subnetSize, newCidr, hostsPerSubnet) {
        subnetsTableBody.innerHTML = '';
        let currentIP = ipToInt(ipBytes);
        const totalSubnets = Math.pow(2, bitsForSubnets);

        for (let i = 0; i < totalSubnets; i++) {
            const networkAddress = intToIP(currentIP);
            const firstHost = intToIP(currentIP + 1);
            const lastHost = intToIP(currentIP + subnetSize - 2);
            const broadcast = intToIP(currentIP + subnetSize - 1);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="subnet-id">Subred ${i+1}</td>
                <td><span class="ip-address">${networkAddress}/${newCidr}</span></td>
                <td><span class="ip-address">${firstHost}</span></td>
                <td><span class="ip-address">${lastHost}</span></td>
                <td><span class="ip-address">${broadcast}</span></td>
                <td>${cidrToMask(newCidr)}</td>
                <td>${hostsPerSubnet}</td>
            `;

            subnetsTableBody.appendChild(row);
            currentIP += subnetSize;
        }
    }

    // ✅ Modificada para aceptar IP con o sin /CIDR
    function isValidNetwork(network) {
        const pattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
        if (!pattern.test(network)) return false;

        const [ip, cidr] = network.split('/');
        const cidrValue = cidr ? parseInt(cidr) : 24; // Valor por defecto /24

        if (cidrValue < 1 || cidrValue > 30) return false;

        const octets = ip.split('.').map(Number);
        if (octets.length !== 4) return false;
        for (let octet of octets) {
            if (octet < 0 || octet > 255) return false;
        }

        return true;
    }

    function ipToInt(ipBytes) {
        return (ipBytes[0] << 24) + (ipBytes[1] << 16) + (ipBytes[2] << 8) + ipBytes[3];
    }

    function intToIP(ipInt) {
        return [
            (ipInt >>> 24) & 255,
            (ipInt >>> 16) & 255,
            (ipInt >>> 8) & 255,
            ipInt & 255
        ].join('.');
    }

    function cidrToMask(cidr) {
        let mask = 0;
        for (let i = 0; i < cidr; i++) {
            mask |= (1 << (31 - i));
        }
        return [
            (mask >>> 24) & 255,
            (mask >>> 16) & 255,
            (mask >>> 8) & 255,
            mask & 255
        ].join('.');
    }

    function exportToCSV() {
        const rows = document.querySelectorAll('#subnetsTable tr');
        let csvContent = "data:text/csv;charset=utf-8,";

        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('th, td');
            let row = [];
            for (let j = 0; j < cells.length; j++) {
                let cellText = cells[j].innerText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                row.push(`"${cellText}"`);
            }
            csvContent += row.join(',') + '\n';
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "subredes_calculadas.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
