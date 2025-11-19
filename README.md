# EyeCodePro - Eye Care Insurance Code Platform

**EyeCodePro** is a sophisticated platform designed specifically for ophthalmologists and optometrists to streamline insurance code selection, reduce claim denials, and maximize practice revenue through AI-powered coding assistance.


## Features

- **Intelligent Code Selection**: AI-powered recommendations for eye care procedures
- **Real-time Claim Validation**: Verify codes against current insurance requirements
- **Revenue Optimization**: Maximize reimbursements with proper code selection
- **Compliance Tracking**: Stay current with coding regulations and requirements
- **Practice Management**: Multi-provider support with role-based access
- **Comprehensive Reporting**: Track coding accuracy and revenue metrics
- **Secure Authentication**: HIPAA-compliant user management
- **Activity Logging**: Complete audit trail for all coding activities

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Payments**: [Stripe](https://stripe.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

```bash
git clone https://github.com/your-org/codeselect
cd codeselect
pnpm install
```

## Running Locally

[Install](https://docs.stripe.com/stripe-cli) and log in to your Stripe account:

```bash
stripe login
```

Use the included setup script to create your `.env` file:

```bash
pnpm db:setup
```

Run the database migrations and seed the database with a default practice:

```bash
pnpm db:migrate
pnpm db:seed
```

This will create the following default practice account:

- User: `test@test.com`
- Password: `admin123`

You can also create new practices through the `/sign-up` route.

Finally, run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the platform.

You can listen for Stripe webhooks locally through their CLI to handle subscription events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Features for Eye Care Professionals

### Code Database
- Complete library of ophthalmology and optometry procedure codes
- Regular updates for new and modified codes
- Cross-referenced with common diagnoses

### Claim Validation
- Real-time verification against insurance requirements
- Automated checks for code compatibility
- Denial prevention through pre-submission validation

### Revenue Optimization
- Identify opportunities for improved reimbursement
- Track coding accuracy and financial impact
- Benchmark against industry standards

### Practice Management
- Multi-provider support for practices of all sizes
- Role-based access control for staff
- Secure, HIPAA-compliant data handling

## Support

For support with CodeSelect, please contact our team at support@codeselect.com or visit our help center.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
