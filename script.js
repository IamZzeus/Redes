/**
 * CALCULADORA DE SUBREDES - SCRIPT PRINCIPAL
 * 
 * Este script contiene la lógica para calcular subredes IP
 * y mostrar los resultados en una tabla interactiva.
 */

// Esperar a que el DOM esté completamente cargado antes de ejecutar el código
document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a los elementos del DOM
    const calculateBtn = document.getElementById('calculateBtn');
    const exportBtn = document.getElementById('exportBtn');
    const resultsSection = document.getElementById('resultsSection');
    const subnetsTableBody = document.getElementById('subnetsTableBody');
    const summaryDiv = document.getElementById('summary');
    
    // Asignar event listeners a los botones
    calculateBtn.addEventListener('click', calculateSubnets);
    exportBtn.addEventListener('click', exportToCSV);
    
    /**
     * Función principal para calcular las subredes
     * Obtiene los datos de entrada, valida y realiza los cálculos
     */
    function calculateSubnets() {
        // Obtener y limpiar la red base del input
        let baseNetwork = document.getElementById('baseNetwork').value.trim();
        // Obtener el número de subredes necesarias
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

        // Separar IP y CIDR de la red base
        const [ip, cidr] = baseNetwork.split('/');
        const cidrValue = parseInt(cidr);
        // Convertir la IP en un array de bytes
        const ipBytes = ip.split('.').map(Number);

        // Calcular el total de IPs en la red
        const totalIPs = Math.pow(2, 32 - cidrValue);
        // Calcular IPs utilizables (excluyendo red y broadcast)
        const usableIPs = totalIPs - 2;

        // Calcular bits necesarios para las subredes
        const bitsForSubnets = Math.ceil(Math.log2(subnetsNeeded));
        // Calcular el nuevo CIDR (máscara extendida)
        const newCidr = cidrValue + bitsForSubnets;

        // Validar que no excedamos el límite de subredes (CIDR máximo 30)
        if (newCidr > 30) {
            alert('Demasiadas subredes solicitadas. Intenta con un número menor.');
            return;
        }

        // Calcular el tamaño de cada subred
        const subnetSize = Math.pow(2, 32 - newCidr);
        // Calcular hosts utilizables por subred
        const hostsPerSubnet = subnetSize - 2;

        // Actualizar el resumen y generar la tabla
        updateSummary(baseNetwork, subnetsNeeded, bitsForSubnets, newCidr, hostsPerSubnet);
        generateSubnetsTable(ipBytes, bitsForSubnets, subnetSize, newCidr, hostsPerSubnet);

        // Mostrar la sección de resultados
        resultsSection.style.display = 'block';
    }

    /**
     * Actualiza el resumen con la información calculada
     * @param {string} baseNetwork - Red base ingresada por el usuario
     * @param {number} subnetsNeeded - Número de subredes solicitadas
     * @param {number} bitsForSubnets - Bits usados para subredes
     * @param {number} newCidr - Nueva máscara CIDR
     * @param {number} hostsPerSubnet - Hosts utilizables por subred
     */
    function updateSummary(baseNetwork, subnetsNeeded, bitsForSubnets, newCidr, hostsPerSubnet) {
        summaryDiv.innerHTML = `
            <p><strong>Red Base:</strong> ${baseNetwork}</p>
            <p><strong>Subredes Solicitadas:</strong> ${subnetsNeeded}</p>
            <p><strong>Subredes Creadas:</strong> ${Math.pow(2, bitsForSubnets)}</p>
            <p><strong>Nueva Máscara:</strong> /${newCidr} (${cidrToMask(newCidr)})</p>
            <p><strong>Hosts por Subred:</strong> ${hostsPerSubnet}</p>
        `;
    }

    /**
     * Genera la tabla con la información de todas las subredes calculadas
     * @param {Array} ipBytes - Array con los 4 octetos de la IP base
     * @param {number} bitsForSubnets - Bits usados para subredes
     * @param {number} subnetSize - Tamaño de cada subred
     * @param {number} newCidr - Nueva máscara CIDR
     * @param {number} hostsPerSubnet - Hosts utilizables por subred
     */
    function generateSubnetsTable(ipBytes, bitsForSubnets, subnetSize, newCidr, hostsPerSubnet) {
        // Limpiar la tabla existente
        subnetsTableBody.innerHTML = '';
        
        // Convertir la IP base a entero para facilitar cálculos
        let currentIP = ipToInt(ipBytes);
        // Calcular el total de subredes que se crearán (potencia de 2)
        const totalSubnets = Math.pow(2, bitsForSubnets);

        // Generar una fila por cada subred
        for (let i = 0; i < totalSubnets; i++) {
            // Calcular las direcciones importantes de la subred
            const networkAddress = intToIP(currentIP);
            const firstHost = intToIP(currentIP + 1);
            const lastHost = intToIP(currentIP + subnetSize - 2);
            const broadcast = intToIP(currentIP + subnetSize - 1);

            // Crear la fila de la tabla
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

            // Agregar la fila a la tabla
            subnetsTableBody.appendChild(row);
            // Avanzar a la siguiente subred
            currentIP += subnetSize;
        }
    }

    /**
     * Valida si una cadena representa una red IP válida
     * @param {string} network - Cadena con la red a validar
     * @returns {boolean} True si la red es válida, False en caso contrario
     */
    function isValidNetwork(network) {
        // Patrón regex para validar formato IP con CIDR opcional
        const pattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
        if (!pattern.test(network)) return false;

        // Separar IP y CIDR
        const [ip, cidr] = network.split('/');
        const cidrValue = cidr ? parseInt(cidr) : 24; // Valor por defecto /24

        // Validar rango del CIDR
        if (cidrValue < 1 || cidrValue > 30) return false;

        // Validar cada octeto de la IP
        const octets = ip.split('.').map(Number);
        if (octets.length !== 4) return false;
        for (let octet of octets) {
            if (octet < 0 || octet > 255) return false;
        }

        return true;
    }

    /**
     * Convierte una IP en formato de array de bytes a entero de 32 bits
     * @param {Array} ipBytes - Array con los 4 octetos [192, 168, 1, 0]
     * @returns {number} IP representada como entero de 32 bits
     */
    function ipToInt(ipBytes) {
        return (ipBytes[0] << 24) + (ipBytes[1] << 16) + (ipBytes[2] << 8) + ipBytes[3];
    }

    /**
     * Convierte un entero de 32 bits a formato IP string
     * @param {number} ipInt - IP como entero de 32 bits
     * @returns {string} IP en formato "192.168.1.0"
     */
    function intToIP(ipInt) {
        return [
            (ipInt >>> 24) & 255,  // Primer octeto
            (ipInt >>> 16) & 255,  // Segundo octeto
            (ipInt >>> 8) & 255,   // Tercer octeto
            ipInt & 255            // Cuarto octeto
        ].join('.');
    }

    /**
     * Convierte notación CIDR a máscara de subred
     * @param {number} cidr - Valor CIDR (1-30)
     * @returns {string} Máscara de subred en formato "255.255.255.0"
     */
    function cidrToMask(cidr) {
        // Crear máscara como entero de 32 bits
        let mask = 0;
        for (let i = 0; i < cidr; i++) {
            mask |= (1 << (31 - i));
        }
        
        // Convertir a formato IP
        return [
            (mask >>> 24) & 255,
            (mask >>> 16) & 255,
            (mask >>> 8) & 255,
            mask & 255
        ].join('.');
    }

    /**
     * Exporta la tabla de subredes a un archivo CSV
     */
    function exportToCSV() {
        // Obtener todas las filas de la tabla (incluyendo encabezados)
        const rows = document.querySelectorAll('#subnetsTable tr');
        let csvContent = "data:text/csv;charset=utf-8,";

        // Procesar cada fila
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('th, td');
            let row = [];
            
            // Procesar cada celda de la fila
            for (let j = 0; j < cells.length; j++) {
                // Limpiar y formatear el texto de la celda
                let cellText = cells[j].innerText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                // Escapar comillas y agregar al array
                row.push(`"${cellText}"`);
            }
            // Unir las celdas con comas y agregar salto de línea
            csvContent += row.join(',') + '\n';
        }

        // Crear enlace de descarga
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "subredes_calculadas.csv");
        document.body.appendChild(link);
        
        // Simular click para descargar
        link.click();
        
        // Limpiar el enlace del DOM
        document.body.removeChild(link);
    }
});