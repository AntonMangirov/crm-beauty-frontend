import {
  Box,
  Card,
  CardContent,
  Container,
  Grid2 as Grid,
  Skeleton,
  Stack,
} from "@mui/material";

export function MasterSkeleton() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3} alignItems="center">
        <Skeleton variant="circular" width={96} height={96} />
        <Skeleton variant="text" width={220} height={32} />
        <Skeleton variant="text" width={300} height={20} />

        <Card sx={{ width: "100%" }}>
          <CardContent>
            <Stack spacing={2}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <Box key={idx}>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="40%" height={18} />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
