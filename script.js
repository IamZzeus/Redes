/**
 * CALCULADORA DE SUBREDES - SCRIPT PRINCIPAL
 * 
 * Este script contiene la lógica para calcular subredes IP
 * y mostrar los resultados en una tabla interactiva.
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const calculateBtn = document.getElementById('calculateBtn');
    const exportBtn = document.getElementById('exportBtn');
    const resultsSection = document.getElementById('resultsSection');
    const subnetsTableBody = document.getElementById('subnetsTableBody');
    const summaryDiv = document.getElementById('summary');
    
    // Asignar event listeners a los botones
    calculateBtn.addEventListener('click', calculateSubnets);
    exportBtn.addEventListener('click', exportToCSV);
    
    /**
     * FUNCIÓN PRINCIPAL: calculateSubnets
     * Calcula las subredes basándose en los parámetros ingresados
     */
    function calculateSubnets() {
        // Obtener valores de entrada del usuario
        const baseNetwork = document.getElementById('baseNetwork').value;
        const subnetsNeeded = parseInt(document.getElementById('subnetsNeeded').value);
        
        // Validar la red ingresada
        if (!isValidNetwork(baseNetwork)) {
            alert('Por favor, ingresa una red válida en formato CIDR (ej: 192.168.1.0/24)');
            return;
        }
        
        // Validar el número de subredes
        if (isNaN(subnetsNeeded) || subnetsNeeded < 1) {
            alert('Por favor, ingresa un número válido de subredes (mayor que 0)');
            return;
        }
        
        // Parsear la red base: separar IP y CIDR
        const [ip, cidr] = baseNetwork.split('/');
        const cidrValue = parseInt(cidr);
        
        // Convertir la IP a array de bytes
        const ipBytes = ip.split('.').map(Number);
        
        // Calcular información básica de la red
        const totalIPs = Math.pow(2, 32 - cidrValue);
        const usableIPs = totalIPs - 2; // Descontar dirección de red y broadcast
        
        // Calcular cuántos bits necesitamos para las subredes solicitadas
        const bitsForSubnets = Math.ceil(Math.log2(subnetsNeeded));
        const newCidr = cidrValue + bitsForSubnets;
        
        // Validar que no excedamos el límite de 32 bits
        if (newCidr > 30) {
            alert('Demasiadas subredes solicitadas. Intenta con un número menor.');
            return;
        }
        
        // Calcular el tamaño de cada subred
        const subnetSize = Math.pow(2, 32 - newCidr);
        const hostsPerSubnet = subnetSize - 2;
        
        // Actualizar el panel de resumen con la información calculada
        updateSummary(baseNetwork, subnetsNeeded, bitsForSubnets, newCidr, hostsPerSubnet);
        
        // Generar y mostrar las subredes en la tabla
        generateSubnetsTable(ipBytes, bitsForSubnets, subnetSize, newCidr, hostsPerSubnet);
        
        // Mostrar la sección de resultados
        resultsSection.style.display = 'block';
    }
    
    /**
     * FUNCIÓN: updateSummary
     * Actualiza el panel de resumen con la información del cálculo
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
     * FUNCIÓN: generateSubnetsTable
     * Genera la tabla con todas las subredes calculadas
     */
    function generateSubnetsTable(ipBytes, bitsForSubnets, subnetSize, newCidr, hostsPerSubnet) {
        // Limpiar la tabla existente
        subnetsTableBody.innerHTML = '';
        
        // Convertir la IP base a formato numérico para facilitar los cálculos
        let currentIP = ipToInt(ipBytes);
        
        // Calcular cuántas subredes vamos a crear (potencia de 2 más cercana)
        const totalSubnets = Math.pow(2, bitsForSubnets);
        
        // Generar cada subred
        for (let i = 0; i < totalSubnets; i++) {
            // Calcular las direcciones importantes para cada subred
            const networkAddress = intToIP(currentIP);
            const firstHost = intToIP(currentIP + 1);
            const lastHost = intToIP(currentIP + subnetSize - 2);
            const broadcast = intToIP(currentIP + subnetSize - 1);
            
            // Crear una nueva fila para la tabla
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
            
            // Añadir la fila a la tabla
            subnetsTableBody.appendChild(row);
            
            // Avanzar a la siguiente subred
            currentIP += subnetSize;
        }
    }
    
    /**
     * FUNCIÓN: isValidNetwork
     * Valida que la red ingresada tenga un formato correcto
     */
    function isValidNetwork(network) {
    // Aceptar direcciones con o sin CIDR
    const pattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!pattern.test(network)) return false;

    // Separar IP y CIDR (si existe)
    const [ip, cidr] = network.split('/');
    const cidrValue = cidr ? parseInt(cidr) : 24; // Valor por defecto si no se especifica CIDR

    // Validar rango del CIDR (1-30)
    if (cidrValue < 1 || cidrValue > 30) return false;

    // Validar formato de IP
    const octets = ip.split('.').map(Number);
    if (octets.length !== 4) return false;
    for (let octet of octets) {
        if (octet < 0 || octet > 255) return false;
    }

    return true;
}
    
    /**
     * FUNCIÓN: ipToInt
     * Convierte una dirección IP (array de 4 bytes) a un número entero
     */
    function ipToInt(ipBytes) {
        return (ipBytes[0] << 24) + (ipBytes[1] << 16) + (ipBytes[2] << 8) + ipBytes[3];
    }
    
    /**
     * FUNCIÓN: intToIP
     * Convierte un número entero a una dirección IP en formato string
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
     * FUNCIÓN: cidrToMask
     * Convierte notación CIDR a máscara de subred decimal
     */
    function cidrToMask(cidr) {
        let mask = 0;
        
        // Establecer bits en 1 según el valor CIDR
        for (let i = 0; i < cidr; i++) {
            mask |= (1 << (31 - i));
        }
        
        // Convertir el número a formato IP
        return [
            (mask >>> 24) & 255,
            (mask >>> 16) & 255,
            (mask >>> 8) & 255,
            mask & 255
        ].join('.');
    }
    
    /**
     * FUNCIÓN: exportToCSV
     * Exporta la tabla de resultados a un archivo CSV
     */
    function exportToCSV() {
        // Obtener todas las filas de la tabla
        const rows = document.querySelectorAll('#subnetsTable tr');
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Recorrer cada fila
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('th, td');
            let row = [];
            
            // Recorrer cada celda de la fila
            for (let j = 0; j < cells.length; j++) {
                // Limpiar el texto de la celda (eliminar saltos de línea y espacios extra)
                let cellText = cells[j].innerText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                row.push(`"${cellText}"`); // Escapar el texto para CSV
            }
            
            // Añadir la fila al contenido CSV
            csvContent += row.join(',') + '\n';
        }
        
        // Crear un enlace temporal para descargar el archivo
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "subredes_calculadas.csv");
        document.body.appendChild(link);
        
        // Simular clic en el enlace para iniciar la descarga
        link.click();
        
        // Eliminar el enlace temporal
        document.body.removeChild(link);
    }
});