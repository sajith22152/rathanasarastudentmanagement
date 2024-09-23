let db;
let editingStudentId = null;

const request = indexedDB.open("SchoolDB", 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    db.createObjectStore("students", { keyPath: "admissionNumber" });
};

request.onsuccess = function(event) {
    db = event.target.result;
    displayStudents();
};

request.onerror = function(event) {
    console.error("Database error: " + event.target.error);
};

document.getElementById('studentForm').onsubmit = function(event) {
    event.preventDefault();
    const admissionNumber = document.getElementById('admissionNumber').value;

    const student = {
        admissionNumber,
        studentName: document.getElementById('studentName').value,
        address: document.getElementById('address').value,
        dob: document.getElementById('dob').value,
        guardianName: document.getElementById('guardianName').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        siblingClass: document.getElementById('siblingClass').value,
        siblingName: document.getElementById('siblingName').value,
        exitDate: document.getElementById('exitDate').value,
        leaveReason: document.getElementById('leaveReason').value,
    };

    if (editingStudentId) {
        updateStudent(student);
    } else {
        checkAndSaveStudent(student);
    }
};

function checkAndSaveStudent(student) {
    const transaction = db.transaction(["students"], "readonly");
    const store = transaction.objectStore("students");
    const request = store.get(student.admissionNumber);

    request.onsuccess = function() {
        if (request.result) {
            alert("මෙම ඇතුලත් විමේ අංකය දැනටමත් ඇත. කරුණාකර වෙනත් ඇතුලත් විමේ අංකයක් භාවිතා කරන්න.");
        } else {
            saveStudent(student);
        }
    };
}

function saveStudent(student) {
    const transaction = db.transaction(["students"], "readwrite");
    const store = transaction.objectStore("students");
    const request = store.put(student);
    
    request.onsuccess = function() {
        displayStudents();
        document.getElementById('studentForm').reset();
        editingStudentId = null;
    };

    request.onerror = function() {
        alert("ශිෂ්‍ය තොරතුරු ඇතුලත් කිරීමට වරදක් ඇති අතර කරුණාකර නැවත උත්සාහ කරන්න.");
    };
}

function updateStudent(student) {
    const transaction = db.transaction(["students"], "readwrite");
    const store = transaction.objectStore("students");
    const request = store.put(student);
    
    request.onsuccess = function() {
        displayStudents();
        document.getElementById('studentForm').reset();
        editingStudentId = null;
    };

    request.onerror = function() {
        alert("ශිෂ්‍ය තොරතුරු යාවත්කාලීන කිරීමට වරදක් ඇති අතර කරුණාකර නැවත උත්සාහ කරන්න.");
    };
}

function displayStudents() {
    const transaction = db.transaction(["students"], "readonly");
    const store = transaction.objectStore("students");
    const request = store.getAll();

    request.onsuccess = function(event) {
        const studentList = document.getElementById('studentList');
        studentList.innerHTML = "";
        event.target.result.forEach(student => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${student.admissionNumber} - ${student.studentName}</strong><br>
                <button onclick="editStudent('${student.admissionNumber}')">සංශෝධනය කරන්න</button>
                <button onclick="deleteStudent('${student.admissionNumber}')">මකන්න</button>
            `;
            studentList.appendChild(li);
        });
    };
}

function editStudent(admissionNumber) {
    const transaction = db.transaction(["students"], "readonly");
    const store = transaction.objectStore("students");
    const request = store.get(admissionNumber);

    request.onsuccess = function(event) {
        const student = event.target.result;
        if (student) {
            document.getElementById('admissionNumber').value = student.admissionNumber;
            document.getElementById('studentName').value = student.studentName;
            document.getElementById('address').value = student.address;
            document.getElementById('dob').value = student.dob;
            document.getElementById('guardianName').value = student.guardianName;
            document.getElementById('phoneNumber').value = student.phoneNumber;
            document.getElementById('siblingClass').value = student.siblingClass;
            document.getElementById('siblingName').value = student.siblingName;
            document.getElementById('exitDate').value = student.exitDate;
            document.getElementById('leaveReason').value = student.leaveReason;

            editingStudentId = student.admissionNumber;
        }
    };
}

function deleteStudent(admissionNumber) {
    if (confirm("ඔබට මෙම සිසුවා මකා දැමීමට අවශ්‍ය බව විශ්වාසද?")) {
        const transaction = db.transaction(["students"], "readwrite");
        const store = transaction.objectStore("students");
        const request = store.delete(admissionNumber);
        
        request.onsuccess = function() {
            displayStudents();
        };
    }
}

function searchStudents() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const transaction = db.transaction(["students"], "readonly");
    const store = transaction.objectStore("students");
    const request = store.getAll();

    request.onsuccess = function(event) {
        const studentList = document.getElementById('studentList');
        studentList.innerHTML = "";
        const students = event.target.result;

        const filteredStudents = students.filter(student => 
            student.admissionNumber.toLowerCase().includes(input) ||
            student.studentName.toLowerCase().includes(input)
        );

        if (filteredStudents.length > 0) {
            filteredStudents.forEach(student => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>${student.admissionNumber} - ${student.studentName}</strong><br>
                    <button onclick="editStudent('${student.admissionNumber}')">සංශෝධනය කරන්න</button>
                    <button onclick="deleteStudent('${student.admissionNumber}')">මකන්න</button>
                `;
                studentList.appendChild(li);
            });

            const printButton = document.createElement('button');
            printButton.textContent = "මුද්‍රණය කරන්න";
            printButton.onclick = () => printStudents(filteredStudents);
            studentList.appendChild(printButton);
        } else {
            const li = document.createElement('li');
            li.textContent = "කිසිදු ප්‍රතිඵලයක් නොමැත.";
            studentList.appendChild(li);
        }
    };
}

function printStudents(students) {
    let printContent = "<h1>සිසුන්ගේ සම්පූර්ණ තොරතුරු</h1><ul>";
    students.forEach(student => {
        printContent += `
            <li>
                <strong>ඇතුලත් විමේ අංකය:</strong> ${student.admissionNumber}<br>
                <strong>ළමයාගේ නම:</strong> ${student.studentName}<br>
                <strong>ලිපිනය:</strong> ${student.address}<br>
                <strong>උපන් දිනය:</strong> ${student.dob}<br>
                <strong>දෙමපිය භාරකරුගේ නම:</strong> ${student.guardianName}<br>
                <strong>දුරකථන අංකය:</strong> ${student.phoneNumber}<br>
                <strong>සහොදර සහොදරියන් සිටින පන්තිය:</strong> ${student.siblingClass}<br>
                <strong>සහොදර සහොදරියන්ගේ නම:</strong> ${student.siblingName}<br>
                <strong>පාසලෙන් ඉවත් වූ දිනය:</strong> ${student.exitDate}<br>
                <strong>පාසලෙන් ඉවත් වීමට හේතුව:</strong> ${student.leaveReason}
            </li>
        `;
    });
    printContent += "</ul>";

    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>මුද්‍රණය කරන්න</title></head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

function backupData() {
    const transaction = db.transaction(["students"], "readonly");
    const store = transaction.objectStore("students");
    const request = store.getAll();

    request.onsuccess = function(event) {
        const data = JSON.stringify(event.target.result);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_data_backup.json';
        a.click();
        URL.revokeObjectURL(url);
    };
}

function restoreData() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        alert("කරුණාකර ගොනුවක් තෝරන්න.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            const transaction = db.transaction(["students"], "readwrite");
            const store = transaction.objectStore("students");

            // Clear existing data
            store.clear();

            data.forEach(student => {
                store.add(student);
            });

            transaction.oncomplete = function() {
                alert("දත්ත සාර්ථකව නැවත පිහිටුවා ඇත.");
                displayStudents();
            };
        } catch (error) {
            alert("දත්ත නැවත පිහිටුවීමේ දෝෂයක්: " + error.message);
        }
    };

    reader.readAsText(file);
}

// Event listeners
document.getElementById('resetButton').onclick = function() {
    document.getElementById('studentForm').reset();
    editingStudentId = null;
};

document.getElementById('backupButton').onclick = backupData;
document.getElementById('restoreButton').onclick = function() {
    document.getElementById('fileInput').click();
};
document.getElementById('fileInput').onchange = restoreData;
document.getElementById('searchButton').onclick = searchStudents;

// Initial display
displayStudents();