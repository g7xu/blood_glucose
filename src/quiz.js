document.addEventListener('DOMContentLoaded', () => {
    const quizForm = document.getElementById('quiz-form');
    const quizResult = document.getElementById('quiz-result');
    const nextButton = document.getElementById('next-button');
    let currentQuestion = 1;
    let dataset = [];

    async function loadDataset() {
        try {
            const response = await fetch('assets/vis_data/sampled_bio.json');
            dataset = await response.json();
        } catch (error) {
            console.error("Error loading dataset:", error);
        }
    }
    loadDataset();

    function calculateBMI(weight, height) {
        // Convert height from cm to meters
        const heightInMeters = height / 100;
        // Calculate BMI: weight (kg) / height^2 (m)
        return weight / (heightInMeters * heightInMeters);
    }

    const enableNextButton = () => {
        const currentQuestionElement = document.querySelector(`.quiz-question[data-question="${currentQuestion}"]`);
        const inputs = currentQuestionElement.querySelectorAll('input, select');
        let allFilled = true;
        inputs.forEach(input => {
            if (!input.value) {
                allFilled = false;
            }
        });
        nextButton.disabled = !allFilled;
    };

    document.querySelectorAll('.quiz-question input, .quiz-question select').forEach(input => {
        input.addEventListener('input', enableNextButton);
    });

    nextButton.addEventListener('click', () => {
        const currentQuestionElement = document.querySelector(`.quiz-question[data-question="${currentQuestion}"]`);
        const nextQuestionElement = document.querySelector(`.quiz-question[data-question="${currentQuestion + 1}"]`);

        if (nextQuestionElement) {
            currentQuestionElement.style.display = 'none';
            nextQuestionElement.style.display = 'block';
            currentQuestion++;
            nextButton.disabled = true;
        }

        if (!document.querySelector(`.quiz-question[data-question="${currentQuestion + 1}"]`)) {
            nextButton.style.display = 'none';
            quizForm.querySelector('button[type="submit"]').style.display = 'block';
        }
    });

    quizForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const formData = new FormData(quizForm);
        const weight = formData.get('weight');
        const height = formData.get('height');
        const gender = formData.get('gender');

        const userBMI = calculateBMI(weight, height);
    
    // Find closest matches from each diabetes level
    const k = 3; // Number of nearest neighbors
        const matches = findClosestMatches(userBMI, gender, k);

        quizForm.innerHTML = ''; 

        quizResult.innerHTML = `
        <h3 id = "header">Your Closest Matches <br> For Each Diabetic Level:</h3>
        <p id = "match" >Non-diabetic Participant ${matches["Non-diabetic"]} <br>
        Pre-diabetic Participant ${matches["Pre-diabetic"]}<br>
       Diabetic Participant ${matches["Diabetic"]}<br> </p>
        <p id="result">Pay attention to matched participants in the visualizations to see how your glucose levels may compare.</p>
        `;
    });


    function findClosestMatches(userBMI, userGender, k = 3) {
        const formattedUserGender = userGender === "Male" ? "M" : (userGender === "Female" ? "F" : null);
    
        // Compute distances for all participants
        let distances = dataset.map(person => {
            const bmiDiff = Math.abs(person.BMI - userBMI);
            const genderMatch = (formattedUserGender === null || person.Gender === formattedUserGender) ? 0 : 1; // Gender is optional
    
            // Euclidean distance (BMI + optional gender factor)
            const distance = Math.sqrt(bmiDiff ** 2 + genderMatch ** 2);
    
            return { pid: person.PID, diabetesLevel: person["diabetes level"], distance };
        });
    
        // Sort dataset by closest distance
        distances.sort((a, b) => a.distance - b.distance);
    
        // Group participants by diabetes level
        const closestMatches = { "Non-diabetic": null, "Pre-diabetic": null, "Diabetic": null };
    
        distances.forEach(person => {
            if (!closestMatches[person.diabetesLevel]) {
                closestMatches[person.diabetesLevel] = person.pid;
            }
        });
    
        // Fallback for any missing groups
        Object.keys(closestMatches).forEach(level => {
            if (!closestMatches[level]) {
                closestMatches[level] = "No match found";
            }
        });
    
        return closestMatches;
    }
});