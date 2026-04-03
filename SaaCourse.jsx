import { useState, useRef, useEffect } from "react";

const WEEKS = [
  {
    week: 1,
    title: "VPC Foundations & Network Architecture",
    domain: "Design Secure Architectures",
    domainWeight: "30%",
    accent: "#F97316",
    status: "detailed",
    overview:
      "Build your own production-grade VPC from scratch. By the end of this week you'll have a multi-AZ network with public and private subnets, NAT, routing, and security layers — the single most tested architecture on the SAA-C03.",
    concepts: [
      {
        title: "VPC Design & CIDR Planning",
        detail:
          "Understand how to carve a /16 VPC into /24 subnets across AZs. Know why you leave room for future expansion. SAA questions test whether you can identify correct CIDR blocks and spot overlapping ranges in peering scenarios.",
        exam: "Expect 2–3 questions on subnet sizing, CIDR overlap in peering, and why /28 is the minimum subnet size."
      },
      {
        title: "Public vs Private Subnets",
        detail:
          "A subnet is public ONLY if its route table has a 0.0.0.0/0 route to an Internet Gateway. Private subnets route outbound traffic through a NAT Gateway for patches and updates, but reject all inbound internet traffic.",
        exam: "The exam loves 'how do you make a subnet public?' — the answer is always IGW + Route Table, never just attaching an IGW."
      },
      {
        title: "Security Groups vs NACLs",
        detail:
          "Security Groups are stateful firewalls at the instance level (return traffic auto-allowed). NACLs are stateless firewalls at the subnet level (must explicitly allow both directions). NACLs process rules in order; Security Groups evaluate all rules.",
        exam: "Classic question: 'traffic is allowed inbound but responses are blocked' — that's a NACL missing an outbound rule (stateless)."
      },
      {
        title: "NAT Gateway Architecture",
        detail:
          "NAT Gateway lives in a PUBLIC subnet but serves PRIVATE subnets. It needs an Elastic IP. For HA, deploy one NAT Gateway per AZ. This is a cost vs resilience trade-off the exam tests.",
        exam: "If a question says 'private instances can't reach the internet for updates' — check: is NAT in a public subnet? Does the private route table point to it?"
      },
      {
        title: "VPC Endpoints (Gateway & Interface)",
        detail:
          "Gateway endpoints are free and work for S3 and DynamoDB — traffic stays on AWS's network. Interface endpoints (powered by PrivateLink) work for most other services but cost money. Both keep traffic off the public internet.",
        exam: "Anytime a question mentions 'access S3 without traversing the internet' — VPC Gateway Endpoint."
      },
      {
        title: "VPC Peering vs Transit Gateway",
        detail:
          "Peering is a 1-to-1 connection between two VPCs (not transitive). Transit Gateway is a hub that connects many VPCs and on-premises networks. At scale (>3 VPCs), Transit Gateway is the answer.",
        exam: "'Connect 15 VPCs' = Transit Gateway. 'Connect VPC-A to VPC-B' = Peering. 'Peering is transitive' = always wrong."
      }
    ],
    labs: [
      {
        title: "Lab 1: Build a Production VPC",
        time: "90 min",
        difficulty: "Foundation",
        steps: [
          "Create a VPC with CIDR 10.0.0.0/16",
          "Create 4 subnets: 2 public (/24) and 2 private (/24), one pair per AZ (us-east-1a, us-east-1b)",
          "Create and attach an Internet Gateway to the VPC",
          "Create a public route table with 0.0.0.0/0 → IGW and associate it with both public subnets",
          "Create a NAT Gateway in one public subnet (allocate an Elastic IP)",
          "Create a private route table with 0.0.0.0/0 → NAT Gateway and associate it with both private subnets",
          "Verify: launch an EC2 in the public subnet — confirm you can SSH to it from your IP",
          "Verify: launch an EC2 in the private subnet — confirm it can ping 8.8.8.8 outbound but you cannot SSH directly to it"
        ],
        reinforces: "Subnet types, route tables, IGW, NAT Gateway, the full data path"
      },
      {
        title: "Lab 2: Security Layers — SGs & NACLs",
        time: "45 min",
        difficulty: "Foundation",
        steps: [
          "Create a Security Group allowing SSH (port 22) from your IP only and HTTP (port 80) from anywhere",
          "Attach it to your public EC2 instance",
          "Create a custom NACL for the public subnet: allow inbound HTTP/SSH, allow outbound ephemeral ports (1024–65535)",
          "Test: remove the outbound NACL rule and watch HTTP break (stateless!), then add it back",
          "Create a Security Group for the private EC2 allowing traffic ONLY from the public subnet's SG (SG-to-SG reference)",
          "Verify: SSH to public instance, then SSH from there to the private instance (bastion pattern)"
        ],
        reinforces: "Stateful vs stateless, SG chaining, bastion host pattern, NACL rule ordering"
      },
      {
        title: "Lab 3: VPC Endpoints for S3",
        time: "30 min",
        difficulty: "Intermediate",
        steps: [
          "Create an S3 bucket and upload a test file",
          "From your private EC2 (via bastion), run: aws s3 ls — note it works via NAT",
          "Create a VPC Gateway Endpoint for S3 and attach it to the private route table",
          "Check the route table — a new route for the S3 prefix list appears automatically",
          "Optionally: remove the NAT Gateway route and confirm S3 still works via the endpoint (traffic stays private)"
        ],
        reinforces: "Gateway endpoints, private connectivity to S3, route table mechanics"
      },
      {
        title: "Lab 4: VPC Flow Logs & Troubleshooting",
        time: "30 min",
        difficulty: "Intermediate",
        steps: [
          "Enable VPC Flow Logs on your VPC, sending to CloudWatch Logs",
          "Generate traffic: SSH to your instances, curl a website, try a blocked port",
          "Wait 2–3 minutes, then check CloudWatch Logs for the flow log group",
          "Find an ACCEPT record (allowed traffic) and a REJECT record (blocked traffic)",
          "Read the fields: source IP, destination IP, port, protocol, action — understand each"
        ],
        reinforces: "Flow log structure, troubleshooting connectivity, CloudWatch Logs integration"
      }
    ],
    checkpoint: [
      "Can you draw a VPC diagram from memory with public/private subnets, IGW, NAT, and route tables?",
      "Can you explain why removing a NACL outbound rule breaks HTTP but removing a Security Group outbound rule doesn't?",
      "Can you explain the data path of a request from the internet → ALB → private EC2 → S3 via endpoint?"
    ]
  },
  {
    week: 2,
    title: "IAM Deep Dive & Encryption",
    domain: "Design Secure Architectures",
    domainWeight: "30%",
    accent: "#EF4444",
    status: "summary",
    overview:
      "Go beyond basic IAM users and groups into the policy evaluation logic, cross-account roles, resource-based policies, and encryption patterns (KMS, CloudHSM, S3 encryption modes) that dominate the security domain.",
    topics: [
      "IAM policy evaluation: explicit deny → SCP → permission boundary → identity policy → resource policy",
      "Cross-account access with IAM Roles (sts:AssumeRole)",
      "Resource-based policies (S3 bucket policies, KMS key policies) vs identity-based policies",
      "KMS: CMKs, key rotation, grants, envelope encryption",
      "S3 encryption: SSE-S3, SSE-KMS, SSE-C, client-side — when to use each",
      "CloudHSM for single-tenant regulatory requirements",
      "AWS Certificate Manager for SSL/TLS on ALBs and CloudFront"
    ],
    labPreview: "Build a cross-account role assumption flow. Encrypt an S3 bucket with KMS and restrict decryption to specific IAM roles. Set up ACM on an ALB."
  },
  {
    week: 3,
    title: "EC2, Auto Scaling & Load Balancing",
    domain: "Design Resilient Architectures",
    domainWeight: "26%",
    accent: "#3B82F6",
    status: "summary",
    overview:
      "Build a multi-AZ auto-scaling web tier behind an Application Load Balancer. Cover launch templates, scaling policies, health checks, sticky sessions, and the EC2 pricing models that show up in cost-optimization questions.",
    topics: [
      "Launch Templates vs Launch Configurations (templates are current best practice)",
      "Auto Scaling: target tracking, step scaling, scheduled scaling, predictive scaling",
      "ALB vs NLB vs GLB — listener rules, path-based routing, host-based routing",
      "Connection draining, health checks, cross-zone load balancing",
      "EC2 placement groups: cluster, spread, partition",
      "Instance store vs EBS, EBS volume types (gp3, io2, st1, sc1)",
      "EC2 pricing: On-Demand, Reserved, Savings Plans, Spot, Dedicated Hosts"
    ],
    labPreview: "Deploy a multi-AZ ASG with an ALB, configure target tracking to scale on CPU, simulate load, and watch instances scale out and in."
  },
  {
    week: 4,
    title: "Storage & Data Management",
    domain: "Design High-Performing Architectures",
    domainWeight: "24%",
    accent: "#10B981",
    status: "summary",
    overview:
      "Master S3 (lifecycle policies, versioning, replication, access points, presigned URLs), EBS snapshots, EFS vs FSx, and the data migration family (DataSync, Transfer Family, Snow devices, Storage Gateway).",
    topics: [
      "S3 storage classes and lifecycle transitions (Standard → IA → Glacier → Deep Archive)",
      "S3 versioning, MFA delete, object lock (compliance vs governance mode)",
      "S3 Cross-Region Replication vs Same-Region Replication",
      "S3 presigned URLs, access points, and bucket policies",
      "EBS: snapshots, encryption, fast snapshot restore, multi-attach (io2)",
      "EFS: performance modes, throughput modes, IA storage class",
      "FSx: Windows File Server vs Lustre — when to pick each",
      "Migration: Snowball vs DataSync vs Transfer Family vs Storage Gateway"
    ],
    labPreview: "Set up S3 lifecycle policies, cross-region replication with KMS, and build an EFS shared mount across two EC2 instances in different AZs."
  },
  {
    week: 5,
    title: "Databases & Caching",
    domain: "Design Resilient + High-Performing",
    domainWeight: "26% + 24%",
    accent: "#EC4899",
    status: "summary",
    overview:
      "RDS Multi-AZ vs Read Replicas, Aurora architecture (cluster endpoints, global databases, serverless v2), DynamoDB (partition keys, GSIs, DAX, streams), ElastiCache (Redis vs Memcached), and Redshift for analytics.",
    topics: [
      "RDS: Multi-AZ (HA failover) vs Read Replicas (read scaling) — know the difference cold",
      "Aurora: 6-way replication, cluster/reader endpoints, global databases, serverless v2",
      "DynamoDB: partition key design, GSI vs LSI, on-demand vs provisioned, DAX, Streams",
      "ElastiCache: Redis (persistence, replication) vs Memcached (simple, multi-threaded)",
      "Redshift: distribution styles, sort keys, Spectrum for S3 queries",
      "Database migration: DMS, Schema Conversion Tool"
    ],
    labPreview: "Deploy RDS Multi-AZ with a read replica, set up DynamoDB with a GSI, and put ElastiCache Redis in front of RDS to see the latency difference."
  },
  {
    week: 6,
    title: "Serverless, Containers & Decoupling",
    domain: "Design High-Performing Architectures",
    domainWeight: "24%",
    accent: "#8B5CF6",
    status: "summary",
    overview:
      "Lambda (concurrency, layers, destinations, VPC integration), API Gateway (REST vs HTTP API), Step Functions, ECS vs EKS vs Fargate, and the messaging trio: SQS, SNS, EventBridge.",
    topics: [
      "Lambda: concurrency limits, provisioned concurrency, VPC config, layers, destinations",
      "API Gateway: REST API vs HTTP API, throttling, caching, stages",
      "Step Functions: standard vs express workflows",
      "ECS on Fargate vs ECS on EC2 vs EKS — container orchestration trade-offs",
      "SQS: standard vs FIFO, visibility timeout, dead-letter queues, long polling",
      "SNS: fan-out pattern, message filtering, FIFO topics",
      "EventBridge: event bus, scheduled rules, schema registry",
      "Kinesis Data Streams vs Kinesis Firehose — real-time vs near-real-time"
    ],
    labPreview: "Build an API Gateway → Lambda → DynamoDB stack, add SQS dead-letter queue, and create an SNS fan-out to Lambda + SQS."
  },
  {
    week: 7,
    title: "Monitoring, Logging & Cost Optimization",
    domain: "Design Cost-Optimized Architectures",
    domainWeight: "20%",
    accent: "#F59E0B",
    status: "summary",
    overview:
      "CloudWatch (metrics, alarms, dashboards, Logs Insights), CloudTrail, X-Ray for distributed tracing, AWS Config rules, and the full cost toolkit: Cost Explorer, Budgets, Compute Optimizer, right-sizing.",
    topics: [
      "CloudWatch: custom metrics, metric math, composite alarms, anomaly detection",
      "CloudWatch Logs: log groups, Logs Insights queries, metric filters",
      "CloudTrail: management events vs data events, organization trail, log integrity",
      "X-Ray: tracing Lambda, API Gateway, ECS — segment, subsegment, annotations",
      "AWS Config: managed rules, remediation actions, conformance packs",
      "Cost optimization: Compute Optimizer, right-sizing, S3 Intelligent-Tiering, reserved capacity planning",
      "Trusted Advisor checks: cost, security, performance, fault tolerance, service limits"
    ],
    labPreview: "Create CloudWatch alarms for EC2 and Lambda, set up Logs Insights queries, enable X-Ray on a Lambda function, and run Cost Explorer analysis."
  },
  {
    week: 8,
    title: "Practice Exams & Gap Analysis",
    domain: "All Domains",
    domainWeight: "100%",
    accent: "#06B6D4",
    status: "summary",
    overview:
      "Full-length timed practice exams using your custom exam tool. After each exam: score by domain, identify weak spots, update your study guide, and re-drill. Target: 80%+ consistently before booking the real exam.",
    topics: [
      "Take Practice Exam 1 — full 65 questions, 130 minutes, strict timing",
      "Gap analysis: score by domain, identify the service pairs you're confusing",
      "Targeted re-study of weak domains using your study guide",
      "Take Practice Exam 2 — track improvement by domain",
      "Review the SAA-C03 exam guide's sample questions",
      "Final drill: rapid-fire service selection scenarios (30 seconds per question)",
      "Book your exam — you have the 50% discount voucher from passing CCP"
    ],
    labPreview: "Build 2 full-length SAA-C03 practice exams in your custom React exam tool, weighted toward your weakest domains."
  }
];

const DomainBar = () => {
  const domains = [
    { name: "Secure", weight: 30, color: "#EF4444" },
    { name: "Resilient", weight: 26, color: "#3B82F6" },
    { name: "High-Perf", weight: 24, color: "#10B981" },
    { name: "Cost", weight: 20, color: "#F59E0B" }
  ];
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 8, marginBottom: "0.6rem" }}>
        {domains.map((d) => (
          <div key={d.name} style={{ width: `${d.weight}%`, background: d.color }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {domains.map((d) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: d.color }} />
            <span style={{ color: "#94A3B8", fontSize: "0.65rem", fontFamily: "'DM Mono', monospace" }}>
              {d.name} {d.weight}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ConceptCard = ({ concept, index, accent }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: "#1E293B",
        border: `1px solid ${open ? accent + "44" : "#334155"}`,
        borderRadius: 10,
        overflow: "hidden",
        transition: "border-color 0.2s"
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          padding: "0.85rem 1rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          textAlign: "left"
        }}
      >
        <span
          style={{
            color: accent,
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.65rem",
            opacity: 0.5,
            flexShrink: 0,
            width: 20
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span style={{ color: "#E2E8F0", fontSize: "0.85rem", fontWeight: 500, flex: 1, lineHeight: 1.4 }}>
          {concept.title}
        </span>
        <span
          style={{
            color: "#475569",
            fontSize: "0.9rem",
            transform: open ? "rotate(90deg)" : "rotate(0)",
            transition: "transform 0.2s",
            flexShrink: 0
          }}
        >
          ›
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 1rem 1rem 2.75rem" }}>
          <p style={{ color: "#CBD5E1", fontSize: "0.82rem", lineHeight: 1.7, margin: "0 0 0.75rem 0" }}>
            {concept.detail}
          </p>
          <div
            style={{
              background: "#0F172A",
              borderLeft: `2px solid ${accent}`,
              borderRadius: "0 6px 6px 0",
              padding: "0.55rem 0.8rem"
            }}
          >
            <span
              style={{
                color: accent,
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.55rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase"
              }}
            >
              Exam Intel
            </span>
            <p style={{ color: "#94A3B8", fontSize: "0.78rem", lineHeight: 1.6, margin: "0.25rem 0 0 0" }}>
              {concept.exam}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const LabCard = ({ lab }) => {
  const [open, setOpen] = useState(false);
  const diffColors = { Foundation: "#10B981", Intermediate: "#F59E0B", Advanced: "#EF4444" };
  return (
    <div
      style={{
        background: "#0F172A",
        border: `1px solid ${open ? "#10B98133" : "#334155"}`,
        borderRadius: 10,
        overflow: "hidden",
        transition: "border-color 0.2s"
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          padding: "0.85rem 1rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          textAlign: "left"
        }}
      >
        <span style={{ fontSize: "1rem", flexShrink: 0 }}>🧪</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#E2E8F0", fontSize: "0.85rem", fontWeight: 500, lineHeight: 1.3 }}>{lab.title}</div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
            <span style={{ color: diffColors[lab.difficulty] || "#94A3B8", fontSize: "0.6rem", fontFamily: "'DM Mono', monospace" }}>
              {lab.difficulty}
            </span>
            <span style={{ color: "#475569", fontSize: "0.6rem", fontFamily: "'DM Mono', monospace" }}>~{lab.time}</span>
          </div>
        </div>
        <span
          style={{
            color: "#475569",
            fontSize: "0.9rem",
            transform: open ? "rotate(90deg)" : "rotate(0)",
            transition: "transform 0.2s",
            flexShrink: 0
          }}
        >
          ›
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 1rem 1rem 2.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginBottom: "0.75rem" }}>
            {lab.steps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                <span
                  style={{
                    color: "#10B981",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.6rem",
                    flexShrink: 0,
                    marginTop: "0.2rem",
                    opacity: 0.6,
                    width: 14,
                    textAlign: "right"
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ color: "#CBD5E1", fontSize: "0.8rem", lineHeight: 1.55 }}>{step}</span>
              </div>
            ))}
          </div>
          <div style={{ background: "#1E293B", borderRadius: 8, padding: "0.55rem 0.8rem", display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
            <span style={{ color: "#10B981", fontSize: "0.75rem", flexShrink: 0 }}>↳</span>
            <span style={{ color: "#94A3B8", fontSize: "0.75rem", lineHeight: 1.5 }}>
              <strong style={{ color: "#CBD5E1" }}>Reinforces:</strong> {lab.reinforces}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const WeekDetailed = ({ week }) => (
  <div>
    <p style={{ color: "#94A3B8", fontSize: "0.88rem", lineHeight: 1.7, marginBottom: "1.75rem" }}>
      {week.overview}
    </p>

    <div style={{ marginBottom: "2rem" }}>
      <div style={{ fontSize: "0.6rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", color: "#64748B", textTransform: "uppercase", marginBottom: "0.75rem" }}>
        Concepts to Master
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {week.concepts.map((c, i) => (
          <ConceptCard key={i} concept={c} index={i} accent={week.accent} />
        ))}
      </div>
    </div>

    <div style={{ marginBottom: "2rem" }}>
      <div style={{ fontSize: "0.6rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", color: "#64748B", textTransform: "uppercase", marginBottom: "0.75rem" }}>
        Hands-On Labs
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {week.labs.map((l, i) => (
          <LabCard key={i} lab={l} />
        ))}
      </div>
    </div>

    <div>
      <div style={{ fontSize: "0.6rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", color: "#64748B", textTransform: "uppercase", marginBottom: "0.6rem" }}>
        End-of-Week Checkpoint
      </div>
      <div style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 10, padding: "1rem" }}>
        {week.checkpoint.map((c, i) => (
          <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginBottom: i < week.checkpoint.length - 1 ? "0.6rem" : 0 }}>
            <span style={{ color: "#F97316", flexShrink: 0, fontSize: "0.8rem" }}>◇</span>
            <span style={{ color: "#CBD5E1", fontSize: "0.82rem", lineHeight: 1.55 }}>{c}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const WeekSummary = ({ week }) => (
  <div>
    <p style={{ color: "#94A3B8", fontSize: "0.88rem", lineHeight: 1.7, marginBottom: "1.25rem" }}>
      {week.overview}
    </p>
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ fontSize: "0.6rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", color: "#64748B", textTransform: "uppercase", marginBottom: "0.6rem" }}>
        Topics
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {week.topics.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
            <span style={{ color: week.accent, fontSize: "0.4rem", flexShrink: 0, marginTop: "0.35rem" }}>●</span>
            <span style={{ color: "#CBD5E1", fontSize: "0.8rem", lineHeight: 1.55 }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
    <div style={{ background: "#0F172A", border: "1px dashed #334155", borderRadius: 10, padding: "0.85rem 1rem" }}>
      <div style={{ fontSize: "0.55rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", color: "#475569", textTransform: "uppercase", marginBottom: "0.35rem" }}>
        Lab Preview
      </div>
      <p style={{ color: "#94A3B8", fontSize: "0.8rem", lineHeight: 1.5, margin: 0 }}>{week.labPreview}</p>
    </div>
  </div>
);

export default function SaaCourse() {
  const [activeWeek, setActiveWeek] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const contentRef = useRef(null);
  const weekNavRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeWeek]);

  const w = WEEKS[activeWeek];

  const selectWeek = (i) => {
    setActiveWeek(i);
    setMenuOpen(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0B1120",
        fontFamily: "'Newsreader', Georgia, serif",
        color: "#E2E8F0"
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500;6..72,600;6..72,700&family=DM+Mono:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1E293B", padding: isMobile ? "1.25rem 1rem 1rem" : "2rem 2rem 1.75rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.2em", color: "#F97316", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            AWS Solutions Architect — Associate · SAA-C03
          </div>
          <h1 style={{ fontSize: isMobile ? "1.5rem" : "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 600, color: "#F8FAFC", lineHeight: 1.15, margin: "0 0 0.4rem 0", letterSpacing: "-0.02em" }}>
            8-Week Learning Course
          </h1>
          <p style={{ color: "#64748B", fontSize: "0.82rem", lineHeight: 1.5, margin: "0 0 1.25rem 0", maxWidth: 600 }}>
            Exam prep + hands-on console labs. Each week builds real architecture skills.
          </p>
          <DomainBar />
        </div>
      </div>

      {/* Mobile: week selector */}
      {isMobile && (
        <div style={{ borderBottom: "1px solid #1E293B", background: "#0F172A", position: "sticky", top: 0, zIndex: 20 }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              padding: "0.85rem 1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: w.accent, background: w.accent + "18", border: `1px solid ${w.accent}33`, borderRadius: 5, padding: "0.15rem 0.45rem" }}>
                W{w.week}
              </span>
              <span style={{ color: "#E2E8F0", fontSize: "0.85rem", fontWeight: 500 }}>{w.title}</span>
            </div>
            <span style={{ color: "#475569", fontSize: "0.85rem", transform: menuOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</span>
          </button>
          {menuOpen && (
            <div style={{ borderTop: "1px solid #1E293B", maxHeight: "60vh", overflowY: "auto" }}>
              {WEEKS.map((wk, i) => (
                <button
                  key={i}
                  onClick={() => selectWeek(i)}
                  style={{
                    width: "100%",
                    background: i === activeWeek ? "#1E293B" : "transparent",
                    border: "none",
                    borderLeft: i === activeWeek ? `3px solid ${wk.accent}` : "3px solid transparent",
                    padding: "0.7rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: i === activeWeek ? wk.accent : "#475569", width: 16, flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <span style={{ color: i === activeWeek ? "#E2E8F0" : "#94A3B8", fontSize: "0.8rem", lineHeight: 1.3 }}>
                    {wk.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Desktop layout */}
      <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", minHeight: isMobile ? "auto" : "calc(100vh - 220px)" }}>
        {/* Desktop sidebar */}
        {!isMobile && (
          <div
            style={{
              width: 210,
              flexShrink: 0,
              borderRight: "1px solid #1E293B",
              padding: "1.25rem 0",
              position: "sticky",
              top: 0,
              height: "calc(100vh - 220px)",
              overflowY: "auto"
            }}
          >
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.12em", color: "#475569", textTransform: "uppercase", padding: "0 1rem", marginBottom: "0.6rem" }}>
              Course Map
            </div>
            {WEEKS.map((wk, i) => (
              <button
                key={i}
                onClick={() => selectWeek(i)}
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "flex-start",
                  width: "100%",
                  background: i === activeWeek ? "#1E293B" : "transparent",
                  border: "none",
                  borderLeft: i === activeWeek ? `2px solid ${wk.accent}` : "2px solid transparent",
                  padding: "0.55rem 1rem",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s"
                }}
              >
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: i === activeWeek ? wk.accent : "#475569", flexShrink: 0, marginTop: "0.1rem", width: 12 }}>
                  {i + 1}
                </span>
                <span style={{ color: i === activeWeek ? "#E2E8F0" : "#94A3B8", fontSize: "0.75rem", lineHeight: 1.35, fontWeight: i === activeWeek ? 500 : 400 }}>
                  {wk.title}
                </span>
              </button>
            ))}
            <div style={{ margin: "1.25rem 1rem 0", padding: "0.75rem", background: "#1E293B", borderRadius: 8, border: "1px solid #334155" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.1em", color: "#475569", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                Your Edge
              </div>
              <div style={{ color: "#CBD5E1", fontSize: "0.68rem", lineHeight: 1.5 }}>
                CCP passed ✓<br />
                50% exam voucher<br />
                Custom exam tool
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div ref={contentRef} style={{ flex: 1, padding: isMobile ? "1.25rem 1rem 2rem" : "1.75rem 2.25rem", overflowY: isMobile ? "visible" : "auto" }}>
          {/* Week header */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
              {!isMobile && (
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em", color: w.accent, background: w.accent + "18", border: `1px solid ${w.accent}33`, borderRadius: 5, padding: "0.15rem 0.5rem" }}>
                  WEEK {w.week}
                </span>
              )}
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "#475569" }}>
                {w.domain} · {w.domainWeight}
              </span>
            </div>
            {!isMobile && (
              <h2 style={{ fontSize: "clamp(1.25rem, 3vw, 1.7rem)", fontWeight: 600, color: "#F8FAFC", margin: 0, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                {w.title}
              </h2>
            )}
          </div>

          {w.status === "detailed" ? <WeekDetailed week={w} /> : <WeekSummary week={w} />}

          {/* Nav buttons */}
          <div style={{ marginTop: "2.5rem", paddingTop: "1.25rem", borderTop: "1px solid #1E293B", display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
            {activeWeek > 0 ? (
              <button
                onClick={() => selectWeek(activeWeek - 1)}
                style={{ background: "none", border: "1px solid #334155", borderRadius: 8, padding: "0.55rem 1rem", color: "#94A3B8", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "0.72rem" }}
              >
                ← Week {activeWeek}
              </button>
            ) : <div />}
            {activeWeek < WEEKS.length - 1 && (
              <button
                onClick={() => selectWeek(activeWeek + 1)}
                style={{ background: WEEKS[activeWeek + 1].accent + "18", border: `1px solid ${WEEKS[activeWeek + 1].accent}33`, borderRadius: 8, padding: "0.55rem 1rem", color: WEEKS[activeWeek + 1].accent, cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "0.72rem" }}
              >
                Week {activeWeek + 2} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
