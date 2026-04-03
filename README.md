# AWS SAA-C03 Study App

An interactive study guide for the AWS Solutions Architect Associate (SAA-C03) exam. Built with React and Vite, hosted on GitHub Pages.

**Live site:** https://hfoster1.github.io/aws-study-app/

## What it covers

The app is structured as a weekly study plan aligned to the SAA-C03 exam domains:

| Week | Topic | Exam Domain | Weight |
|------|-------|-------------|--------|
| 1 | VPC Foundations & Network Architecture | Design Secure Architectures | 30% |
| 2 | IAM Deep Dive & Encryption | Design Secure Architectures | 30% |
| 3 | Compute & Auto Scaling | Design Resilient Architectures | 26% |
| 4 | Storage (S3, EBS, EFS) | Design Cost-Optimized Architectures | 20% |
| 5 | Databases (RDS, DynamoDB, Aurora) | Design Resilient Architectures | 26% |
| 6 | High Availability & Disaster Recovery | Design Resilient Architectures | 26% |

Each week includes:
- **Concepts** with exam-focused callouts on what the test actually asks
- **Hands-on labs** with step-by-step AWS Console instructions
- **Checkpoint questions** to test retention before moving on

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Tech stack

- React 18
- Vite
- Deployed via GitHub Actions → GitHub Pages
