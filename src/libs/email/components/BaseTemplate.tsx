import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Button, Img, Heading, Hr, Link } from '@react-email/components';

interface BaseTemplateProps {
  children: React.ReactNode;
  previewText?: string;
}

export const BaseTemplate: React.FC<BaseTemplateProps> = ({ children, previewText }) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Img
              src="https://surgsoc.mahidol.edu/assets/logo_surgsoc.jpg" // TODO: Use real hosted image
              width="50"
              height="50"
              alt="SurgSoc Logo"
              style={logo}
            />
            <Heading style={heading}>SurgSoc Mahidol</Heading>
          </Section>

          <Section style={content}>
            {children}
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Surgery Society, Mahidol University<br />
              <Link href="https://surgsoc.mahidol.edu" style={link}>surgsoc.mahidol.edu</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const logo = {
  margin: '0 auto',
};

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '400',
  color: '#484848',
  textAlign: 'center' as const,
  padding: '17px 0 0',
};

const content = {
  padding: '0 48px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  padding: '0 48px',
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};

const link = {
  color: '#8898aa',
};
