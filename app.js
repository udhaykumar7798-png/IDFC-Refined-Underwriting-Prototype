// Mortgage Underwriting Platform - Application Logic

const personas = {
  CUST001: {
    id: 'CUST001',
    name: 'Rohit Sharma',
    age: 28,
    type: 'Salaried',
    location: 'Pune, Maharashtra',
    income: 92000,
    property: {
      type: 'Built Property',
      area_sqft: 1200,
      year_built: 2018,
      rooms: 3,
      lat: 18.5204,
      lon: 73.8567
    },
    credit_score: 780,
    risk_score: 72,
    avm_value: 5200000,
    avm_confidence: 92,
    cashflow_volatility: 0.12,
    legal_status: 'CLEAR',
    legal_confidence: 85,
    legal_issues: [],
    due_diligence: 91,
    rate_band: '8.5-10%',
    app_status: 'APPROVED',
    journey_notes: 'Fast-track sanction, ideal urban file.',
    aa_consent: true
  },
  CUST002: {
    id: 'CUST002',
    name: 'Shabir Ahmed',
    age: 35,
    type: 'MSME Owner',
    location: 'Indore, Madhya Pradesh',
    income: 57000,
    property: {
      type: 'Residential Plot',
      area_sqft: 1800,
      year_built: null,
      rooms: null,
      lat: 22.7196,
      lon: 75.8577
    },
    credit_score: 692,
    risk_score: 68,
    avm_value: 3600000,
    avm_confidence: 74,
    cashflow_volatility: 0.22,
    legal_status: 'FLAGGED',
    legal_confidence: 62,
    legal_issues: [
      '3-side-open boundary risk',
      'Mutation certificate missing'
    ],
    due_diligence: 63,
    rate_band: '10-12%',
    app_status: 'FIELD_VERIFICATION',
    journey_notes: 'Verification required; field check resolved risk.',
    aa_consent: true
  },
  CUST003: {
    id: 'CUST003',
    name: 'Priya Patil',
    age: 32,
    type: 'Teacher',
    location: 'Nashik, Maharashtra',
    income: 39000,
    property: {
      type: 'Built Property',
      area_sqft: 900,
      year_built: 2015,
      rooms: 2,
      lat: 19.9975,
      lon: 73.7898
    },
    credit_score: 631,
    risk_score: 74,
    avm_value: 2800000,
    avm_confidence: 71,
    cashflow_volatility: 0.32,
    legal_status: 'BLOCKED',
    legal_confidence: 45,
    legal_issues: [
      'Title mismatch detected',
      'Encumbered property'
    ],
    due_diligence: 40,
    rate_band: '12-14%',
    app_status: 'REJECTED',
    journey_notes: 'Blocked, referred to credit builder.',
    aa_consent: false
  }
};

const consentLog = [
  { event: 'AA-Consent', persona_id: 'CUST001', timestamp: '2025-10-25T09:12:00Z', action: 'Granted' },
  { event: 'AA-Consent', persona_id: 'CUST002', timestamp: '2025-10-25T10:02:00Z', action: 'Granted' },
  { event: 'AA-Consent', persona_id: 'CUST003', timestamp: '2025-10-25T11:32:00Z', action: 'Denied' }
];

const relationshipFunnel = {
  REJECTED: [
    'Enroll in Credit Builder Program',
    'Get consult call with relationship manager',
    'Explore Government-backed Kisan products',
    'Try savings product for eligibility'
  ],
  FIELD_VERIFICATION: [
    'Upload geo-verified field photos',
    'Connector incentive payout',
    'Fast-track review after successful check'
  ],
  APPROVED: [
    'Accept offer, view sanction letter',
    'Onboard to borrower app'
  ]
};

const app = {
  currentView: 'landing',
  currentPersona: null,
  currentCase: null,
  aaConsentGranted: false,
  verificationData: {
    photos: {},
    notes: '',
    gps: null
  },

  init() {
    this.showView('landing');
    this.initGPS();
    this.loadApplicationsList();
  },

  showView(viewName) {
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });
    document.getElementById(`${viewName}-view`).classList.add('active');
    this.currentView = viewName;
  },

  selectRole(role) {
    if (role === 'consumer') {
      this.showView('consumer');
    } else if (role === 'officer') {
      this.showView('officer');
      this.loadApplicationsList();
    } else if (role === 'connector') {
      this.showView('connector');
      this.loadConnectorTasks();
    }
  },

  goBack() {
    this.showView('landing');
    this.resetConsumer();
    this.closeCase();
  },

  // Consumer Journey
  loadPersona() {
    const personaId = document.getElementById('persona-select').value;
    if (!personaId) return;

    const persona = personas[personaId];
    this.currentPersona = persona;

    document.getElementById('property-address').value = persona.location;
    document.getElementById('property-type').value = persona.property.type;
    document.getElementById('property-area').value = persona.property.area_sqft;
  },

  submitProperty() {
    if (!this.currentPersona) {
      this.showToast('Please select a test case', 'error');
      return;
    }

    // Show AA consent modal first
    this.showAAConsentModal();
  },

  showAAConsentModal() {
    document.getElementById('aa-consent-modal').style.display = 'flex';
  },

  closeAAConsent() {
    document.getElementById('aa-consent-modal').style.display = 'none';
  },

  grantAAConsent() {
    this.aaConsentGranted = true;
    this.closeAAConsent();
    
    // Log consent
    const persona = this.currentPersona;
    consentLog.push({
      event: 'AA-Consent',
      persona_id: persona.id,
      timestamp: new Date().toISOString(),
      action: 'Granted'
    });
    
    this.showToast('Consent granted - Analyzing your cashflows...', 'success');
    
    // Simulate processing delay
    setTimeout(() => {
      this.showAssessmentResults();
    }, 1500);
  },

  denyAAConsent() {
    this.aaConsentGranted = false;
    this.closeAAConsent();
    this.showToast('Without consent, we can only provide basic valuation', 'info');
    
    // Log denial
    consentLog.push({
      event: 'AA-Consent',
      persona_id: this.currentPersona.id,
      timestamp: new Date().toISOString(),
      action: 'Denied'
    });
    
    // Show limited results
    setTimeout(() => {
      this.showAssessmentResults();
    }, 500);
  },

  showAssessmentResults() {
    if (!this.currentPersona) return;

    const persona = this.currentPersona;

    // Show results
    document.getElementById('consumer-form').style.display = 'none';
    document.getElementById('consumer-results').style.display = 'block';

    // Due Diligence Score
    const ddScore = persona.due_diligence;
    const ddBadge = document.getElementById('dd-score-badge');
    ddBadge.textContent = ddScore;
    ddBadge.className = 'dd-score-value ' + this.getDDClass(ddScore);
    document.getElementById('dd-score-label').textContent = this.getDDLabel(ddScore);

    // AVM Results
    document.getElementById('avm-value').textContent = `₹${this.formatNumber(persona.avm_value)}`;
    document.getElementById('avm-confidence').textContent = `${persona.avm_confidence}% confidence`;
    document.getElementById('avm-confidence').className = `confidence-badge ${this.getConfidenceClass(persona.avm_confidence)}`;

    // Credit Results
    document.getElementById('credit-score').textContent = persona.credit_score;
    const riskLevel = this.getRiskLevel(persona.credit_score);
    document.getElementById('credit-risk').textContent = riskLevel.label;
    document.getElementById('credit-risk').className = `risk-badge ${riskLevel.class}`;

    // Cashflow Volatility (if consent granted)
    if (this.aaConsentGranted) {
      const volatilityPct = (persona.cashflow_volatility * 100).toFixed(0);
      document.getElementById('cashflow-volatility').textContent = `${volatilityPct}% volatility`;
    } else {
      document.getElementById('cashflow-volatility').textContent = 'Consent required';
    }

    // Legal Results
    const legalBadge = document.getElementById('legal-badge');
    legalBadge.textContent = `${this.getLegalIcon(persona.legal_status)} ${persona.legal_status}`;
    legalBadge.className = `status-badge ${persona.legal_status.toLowerCase()}`;

    document.getElementById('legal-confidence').textContent = `${persona.legal_confidence}% Legal Confidence`;

    const legalMessage = this.getLegalMessage(persona.legal_status, persona.legal_confidence);
    document.getElementById('legal-message').textContent = legalMessage;

    // Legal Issues
    const issuesContainer = document.getElementById('legal-issues');
    if (persona.legal_issues.length > 0) {
      issuesContainer.innerHTML = persona.legal_issues.map(issue => 
        `<div class="issue-item">⚠️ ${issue}</div>`
      ).join('');
    } else {
      issuesContainer.innerHTML = '';
    }

    // Interest Rate
    const rateCard = document.getElementById('interest-rate-card');
    if (this.aaConsentGranted && ddScore >= 50) {
      rateCard.style.display = 'block';
      document.getElementById('interest-rate').textContent = persona.rate_band;
      document.getElementById('rate-explanation').textContent = this.getRateExplanation(persona);
    } else {
      rateCard.style.display = 'none';
    }

    // Loan Estimate or Relationship Funnel
    if (persona.app_status === 'REJECTED' || ddScore < 50) {
      document.getElementById('loan-estimate').style.display = 'none';
      document.getElementById('relationship-funnel').style.display = 'block';
      this.showRelationshipFunnel();
    } else {
      document.getElementById('loan-estimate').style.display = 'block';
      document.getElementById('relationship-funnel').style.display = 'none';
      const loanAmount = Math.floor(persona.avm_value * 0.8);
      document.getElementById('loan-amount').textContent = `₹${this.formatNumber(loanAmount)}`;
    }

    this.showToast('Assessment completed successfully', 'success');
  },

  showRelationshipFunnel() {
    const funnelList = document.getElementById('funnel-options');
    const options = relationshipFunnel.REJECTED;
    funnelList.innerHTML = options.map((option, idx) => `
      <div class="funnel-option" style="animation-delay: ${idx * 0.1}s">
        <span class="funnel-icon">→</span>
        <span>${option}</span>
      </div>
    `).join('');
  },

  resetConsumer() {
    document.getElementById('consumer-form').style.display = 'block';
    document.getElementById('consumer-results').style.display = 'none';
    document.getElementById('persona-select').value = '';
    document.getElementById('property-address').value = '';
    document.getElementById('property-type').value = '';
    document.getElementById('property-area').value = '';
    this.currentPersona = null;
    this.aaConsentGranted = false;
  },

  // Loan Officer Dashboard
  loadApplicationsList() {
    const list = document.getElementById('applications-list');
    if (!list) return;

    const personasArray = Object.values(personas);
    list.innerHTML = personasArray.map(persona => `
      <div class="application-item" onclick="app.openCase('${persona.id}')" data-legal="${persona.legal_status.toLowerCase()}">
        <div class="app-main">
          <div class="app-name">${persona.name}</div>
          <div class="app-details">
            <div class="app-detail">📍 ${persona.location}</div>
            <div class="app-detail">🏠 ${persona.property.type}</div>
            <div class="app-detail">₹${this.formatNumber(persona.avm_value)}</div>
          </div>
        </div>
        <div class="app-badges">
          <div class="dd-score-mini ${this.getDDClass(persona.due_diligence)}">
            DD: ${persona.due_diligence}
          </div>
          <div class="status-badge ${persona.legal_status.toLowerCase()}">
            ${this.getLegalIcon(persona.legal_status)} ${persona.legal_status}
          </div>
          <div class="rate-badge">${persona.rate_band}</div>
        </div>
      </div>
    `).join('');
  },

  filterApplications(filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const items = document.querySelectorAll('.application-item');
    items.forEach(item => {
      if (filter === 'all') {
        item.style.display = 'grid';
      } else {
        item.style.display = item.dataset.legal === filter ? 'grid' : 'none';
      }
    });
  },

  openCase(personaId) {
    const persona = personas[personaId];
    this.currentCase = persona;

    document.getElementById('applications-list').parentElement.style.display = 'none';
    document.getElementById('case-detail').style.display = 'block';

    // Case Header
    document.getElementById('case-name').textContent = `${persona.name} - ${persona.location}`;

    // Due Diligence Score
    const ddScoreDisplay = document.getElementById('detail-dd-score');
    ddScoreDisplay.textContent = persona.due_diligence;
    ddScoreDisplay.className = 'dd-score-large ' + this.getDDClass(persona.due_diligence);
    document.getElementById('detail-dd-label').textContent = this.getDDLabel(persona.due_diligence);

    // Interest Rate
    document.getElementById('detail-rate').textContent = persona.rate_band;
    document.getElementById('detail-rate-note').textContent = this.getRateExplanation(persona);

    // AA Consent Status
    const consentStatus = document.getElementById('detail-consent-status');
    const personaConsent = consentLog.filter(c => c.persona_id === persona.id);
    if (personaConsent.length > 0) {
      const lastConsent = personaConsent[personaConsent.length - 1];
      consentStatus.innerHTML = `
        <div class="consent-item ${lastConsent.action.toLowerCase()}">
          <span class="consent-icon">${lastConsent.action === 'Granted' ? '✓' : '✗'}</span>
          <div>
            <strong>AA Consent: ${lastConsent.action}</strong><br>
            <small>${new Date(lastConsent.timestamp).toLocaleString()}</small>
          </div>
        </div>
      `;
    } else {
      consentStatus.innerHTML = '<p style="color: var(--color-text-secondary);">No consent events logged</p>';
    }

    // AVM Card
    document.getElementById('detail-avm-value').textContent = `₹${this.formatNumber(persona.avm_value)}`;
    document.getElementById('detail-avm-confidence').textContent = `${persona.avm_confidence}%`;
    document.getElementById('detail-avm-meter').style.width = `${persona.avm_confidence}%`;

    // Credit Card
    document.getElementById('detail-credit-score').textContent = persona.credit_score;
    const riskLevel = this.getRiskLevel(persona.credit_score);
    document.getElementById('detail-credit-risk').textContent = riskLevel.label;
    document.getElementById('detail-credit-risk').className = `risk-badge ${riskLevel.class}`;
    
    // Cashflow data
    const volatilityPct = (persona.cashflow_volatility * 100).toFixed(0);
    document.getElementById('detail-cashflow').textContent = `Volatility: ${volatilityPct}%`;

    // Legal Card
    const legalBadge = document.getElementById('detail-legal-badge');
    legalBadge.textContent = `${this.getLegalIcon(persona.legal_status)} ${persona.legal_status}`;
    legalBadge.className = `status-badge-large ${persona.legal_status.toLowerCase()}`;

    document.getElementById('detail-legal-confidence').textContent = `${persona.legal_confidence}%`;
    document.getElementById('detail-legal-meter').style.width = `${persona.legal_confidence}%`;

    // Legal Issues
    const issuesSection = document.getElementById('detail-legal-issues');
    if (persona.legal_issues.length > 0) {
      issuesSection.innerHTML = '<div class="meter-label" style="margin-bottom: 8px;">Issues Detected:</div>' +
        persona.legal_issues.map(issue => `<div class="issue-item">⚠️ ${issue}</div>`).join('');
    } else {
      issuesSection.innerHTML = '<div style="color: var(--legal-clear); font-weight: 500;">✓ No legal issues detected</div>';
    }

    // Legal Actions
    const actionsSection = document.getElementById('detail-legal-actions');
    if (persona.legal_status === 'FLAGGED') {
      actionsSection.innerHTML = `
        <button class="btn btn--primary btn--full-width" onclick="app.triggerVerification()">
          Trigger Local Verification
        </button>
        <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: 8px;">
          Field verification required before approval
        </p>
      `;
    } else if (persona.legal_status === 'BLOCKED') {
      actionsSection.innerHTML = `
        <div style="padding: 12px; background: rgba(229, 57, 53, 0.1); border-radius: 6px; border-left: 3px solid var(--legal-blocked);">
          <strong>Action Required:</strong> Legal issues must be resolved before proceeding.
        </div>
      `;
    } else {
      actionsSection.innerHTML = '<div style="color: var(--legal-clear); font-weight: 500;">✓ Legal verification complete</div>';
    }

    // Workflow Status
    this.updateWorkflow(persona);
  },

  updateWorkflow(persona) {
    // AVM Status
    const avmStep = document.getElementById('workflow-avm');
    avmStep.querySelector('.step-status').textContent = persona.avm_confidence >= 70 ? `✓ ${persona.avm_confidence}%` : `✗ ${persona.avm_confidence}%`;
    avmStep.querySelector('.step-status').style.background = persona.avm_confidence >= 70 ? 'rgba(67, 160, 71, 0.2)' : 'rgba(229, 57, 53, 0.2)';

    // Credit Status
    const creditStep = document.getElementById('workflow-credit');
    creditStep.querySelector('.step-status').textContent = persona.credit_score >= 650 ? `✓ ${persona.credit_score}` : `✗ ${persona.credit_score}`;
    creditStep.querySelector('.step-status').style.background = persona.credit_score >= 650 ? 'rgba(67, 160, 71, 0.2)' : 'rgba(229, 57, 53, 0.2)';

    // Legal Status
    const legalStep = document.getElementById('workflow-legal');
    let legalText = '';
    let legalBg = '';
    if (persona.legal_status === 'CLEAR') {
      legalText = `✓ Clear (${persona.legal_confidence}%)`;
      legalBg = 'rgba(67, 160, 71, 0.2)';
    } else if (persona.legal_status === 'FLAGGED') {
      legalText = `⚠ Flagged (${persona.legal_confidence}%)`;
      legalBg = 'rgba(255, 179, 0, 0.2)';
    } else {
      legalText = `✗ Blocked (${persona.legal_confidence}%)`;
      legalBg = 'rgba(229, 57, 53, 0.2)';
    }
    legalStep.querySelector('.step-status').textContent = legalText;
    legalStep.querySelector('.step-status').style.background = legalBg;

    // Decision based on Due Diligence Score
    const decisionStep = document.getElementById('workflow-decision');
    const approveBtn = document.getElementById('approve-btn');
    const ddScore = persona.due_diligence;

    if (ddScore >= 80 && persona.legal_status === 'CLEAR') {
      decisionStep.querySelector('.step-status').textContent = `✓ Approved (DD: ${ddScore})`;
      decisionStep.querySelector('.step-status').style.background = 'rgba(67, 160, 71, 0.2)';
      approveBtn.disabled = false;
      approveBtn.textContent = `Approve at ${persona.rate_band}`;
    } else if (ddScore >= 50 && persona.legal_status === 'FLAGGED') {
      decisionStep.querySelector('.step-status').textContent = `⚠ Pending (DD: ${ddScore})`;
      decisionStep.querySelector('.step-status').style.background = 'rgba(255, 179, 0, 0.2)';
      approveBtn.disabled = true;
      approveBtn.textContent = 'Field Verification Required';
    } else if (ddScore < 50 || persona.legal_status === 'BLOCKED') {
      decisionStep.querySelector('.step-status').textContent = `✗ Rejected (DD: ${ddScore})`;
      decisionStep.querySelector('.step-status').style.background = 'rgba(229, 57, 53, 0.2)';
      approveBtn.disabled = true;
      approveBtn.textContent = 'Cannot Approve — Show Alternate Paths';
    } else {
      decisionStep.querySelector('.step-status').textContent = `Pending (DD: ${ddScore})`;
      decisionStep.querySelector('.step-status').style.background = 'rgba(255, 179, 0, 0.2)';
      approveBtn.disabled = true;
      approveBtn.textContent = 'Requirements Not Met';
    }
  },

  triggerVerification() {
    this.showToast('Local verification task assigned to field agent', 'success');
    // In real app, this would assign to connector
    setTimeout(() => {
      this.showToast('Field agent notified via mobile app', 'info');
    }, 1500);
  },

  approveCase() {
    if (!this.currentCase) return;
    const persona = this.currentCase;
    this.showToast(`Application for ${persona.name} approved at ${persona.rate_band}!`, 'success');
    setTimeout(() => {
      this.showToast(`Sanction letter generated for ₹${this.formatNumber(Math.floor(persona.avm_value * 0.8))}`, 'info');
    }, 1000);
    setTimeout(() => {
      this.closeCase();
    }, 3000);
  },

  rejectCase() {
    if (!this.currentCase) return;
    const persona = this.currentCase;
    this.showToast(`Application for ${persona.name} rejected — Showing alternate paths...`, 'info');
    
    // Show relationship funnel options
    setTimeout(() => {
      const options = relationshipFunnel.REJECTED;
      this.showToast(`Alternate path: ${options[0]}`, 'success');
    }, 1500);
    
    setTimeout(() => {
      this.closeCase();
    }, 3000);
  },

  closeCase() {
    document.getElementById('case-detail').style.display = 'none';
    const listParent = document.getElementById('applications-list').parentElement;
    if (listParent) {
      listParent.style.display = 'block';
    }
    this.currentCase = null;
  },

  // Connector View
  loadConnectorTasks() {
    const tasksList = document.getElementById('connector-tasks');
    if (!tasksList) return;

    // Find flagged cases
    const flaggedCases = Object.values(personas).filter(p => p.legal_status === 'FLAGGED');

    if (flaggedCases.length === 0) {
      tasksList.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--color-text-secondary);">No active verification tasks</p>';
      return;
    }

    tasksList.innerHTML = flaggedCases.map(persona => `
      <div class="task-item" onclick="app.openVerificationForm('${persona.id}')">
        <div class="task-header">
          <div class="task-title">Legal Field Verification</div>
          <div class="task-status assigned">Assigned</div>
        </div>
        <div class="task-details">
          <strong>${persona.name}</strong><br>
          ${persona.location}<br>
          Property: ${persona.property.type}<br>
          Issues: ${persona.legal_issues.join(', ')}
        </div>
      </div>
    `).join('');
  },

  openVerificationForm(personaId) {
    const persona = personas[personaId];
    document.querySelector('.tasks-section').style.display = 'none';
    document.getElementById('verification-form').style.display = 'block';

    const propertyInfo = document.getElementById('verification-property');
    propertyInfo.innerHTML = `
      <p><strong>Customer:</strong> ${persona.name}</p>
      <p><strong>Location:</strong> ${persona.location}</p>
      <p><strong>Property:</strong> ${persona.property.type} (${persona.property.area_sqft} sq.ft)</p>
      <p><strong>Issues:</strong> ${persona.legal_issues.join(', ')}</p>
    `;

    this.currentCase = persona;
    this.verificationData = { photos: {}, notes: '', gps: null };
    this.updateSubmitButton();
  },

  closeVerification() {
    document.querySelector('.tasks-section').style.display = 'block';
    document.getElementById('verification-form').style.display = 'none';
    this.currentCase = null;
    this.verificationData = { photos: {}, notes: '', gps: null };
  },

  capturePhoto(type, input) {
    const file = input.files[0];
    if (!file) return;

    // Simulate GPS capture
    const gps = this.verificationData.gps || this.generateMockGPS();
    
    this.verificationData.photos[type] = {
      file: file,
      gps: gps,
      timestamp: new Date().toISOString()
    };

    // Update UI
    const photoUpload = input.closest('.photo-upload');
    photoUpload.classList.add('captured');
    photoUpload.querySelector('.upload-status').innerHTML = `✓ Captured<br><small style="font-size: 10px; color: var(--color-success);">GPS: ${gps.lat.toFixed(4)}, ${gps.lon.toFixed(4)}</small>`;

    this.showToast(`${photoUpload.querySelector('.upload-label').textContent} captured with GPS`, 'success');
    this.updateSubmitButton();
  },

  generateMockGPS() {
    if (this.currentCase && this.currentCase.property.lat) {
      return {
        lat: this.currentCase.property.lat + (Math.random() - 0.5) * 0.001,
        lon: this.currentCase.property.lon + (Math.random() - 0.5) * 0.001
      };
    }
    return { lat: 18.5204, lon: 73.8567 };
  },

  initGPS() {
    // Simulate GPS initialization
    setTimeout(() => {
      const gpsText = document.getElementById('gps-text');
      if (gpsText) {
        gpsText.textContent = 'GPS: Location acquired ✓';
        gpsText.style.color = 'var(--legal-clear)';
      }
      this.verificationData.gps = this.generateMockGPS();
    }, 2000);
  },

  updateSubmitButton() {
    const btn = document.getElementById('submit-verification-btn');
    if (!btn) return;

    const requiredPhotos = ['front', 'side1', 'side2', 'road'];
    const capturedPhotos = Object.keys(this.verificationData.photos);
    const allCaptured = requiredPhotos.every(type => capturedPhotos.includes(type));

    btn.disabled = !allCaptured;
    btn.textContent = allCaptured ? 'Submit Verification' : `Submit (${capturedPhotos.length}/4 photos)`;
  },

  submitVerification() {
    if (!this.currentCase) return;

    const notes = document.getElementById('verification-notes').value;
    this.verificationData.notes = notes;

    this.showToast('Verification submitted for officer review', 'success');
    
    // Simulate backend update - in real app, this would update the case status
    setTimeout(() => {
      this.showToast('Legal confidence updated: 62% → 85% (CLEAR)', 'success');
    }, 1000);
    
    setTimeout(() => {
      this.showToast('Your earnings have been updated: +₹500', 'success');
      this.closeVerification();
      this.loadConnectorTasks();
    }, 2500);
  },

  // Utility Functions
  formatNumber(num) {
    if (num >= 10000000) {
      return (num / 10000000).toFixed(2) + ' Cr';
    } else if (num >= 100000) {
      return (num / 100000).toFixed(2) + ' L';
    }
    return num.toLocaleString('en-IN');
  },

  getConfidenceClass(confidence) {
    if (confidence >= 80) return 'high';
    if (confidence >= 60) return 'medium';
    return 'low';
  },

  getRiskLevel(score) {
    if (score >= 750) return { label: 'Low Risk', class: 'low' };
    if (score >= 650) return { label: 'Medium Risk', class: 'medium' };
    return { label: 'High Risk', class: 'high' };
  },

  getDDClass(score) {
    if (score >= 80) return 'dd-green';
    if (score >= 50) return 'dd-yellow';
    return 'dd-red';
  },

  getDDLabel(score) {
    if (score >= 80) return 'Strong — Low Risk';
    if (score >= 50) return 'Moderate — Verify';
    return 'Weak — High Risk';
  },

  getRateExplanation(persona) {
    const volatility = persona.cashflow_volatility;
    const dd = persona.due_diligence;
    
    if (volatility < 0.15 && dd >= 80) {
      return 'Best rate: Low cashflow volatility + strong due diligence';
    } else if (volatility < 0.25 && dd >= 50) {
      return 'Standard rate: Moderate cashflow stability';
    } else {
      return 'Premium rate: Higher risk factors detected';
    }
  },

  getLegalIcon(status) {
    const icons = {
      'CLEAR': '🟢',
      'FLAGGED': '🟡',
      'BLOCKED': '🔴'
    };
    return icons[status] || '⚪';
  },

  getLegalMessage(status, confidence) {
    if (status === 'CLEAR') {
      return 'Legal verification complete — No disputes detected';
    } else if (status === 'FLAGGED') {
      return 'Legal Status: Under Review — Boundary & Title checks in progress';
    } else {
      return 'Legal issues detected — Resolution required before proceeding';
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: '✓',
      error: '✗',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4000);
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  app.init();

  // Notes character counter
  const notesField = document.getElementById('verification-notes');
  if (notesField) {
    notesField.addEventListener('input', (e) => {
      document.getElementById('notes-count').textContent = e.target.value.length;
    });
  }
});