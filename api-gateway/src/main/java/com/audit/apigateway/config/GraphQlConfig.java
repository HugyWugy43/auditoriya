package com.audit.apigateway.config;
import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.graphql.server.WebGraphQlInterceptor;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.Duration;
@Configuration
public class GraphQlConfig {
 @Bean WebGraphQlInterceptor authentication(@Value("${services.user}") String user) {
  return (request,chain) -> {
   String token=request.getHeaders().getFirst("Authorization");
   if(token==null || !token.startsWith("Bearer ")) return reactor.core.publisher.Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
   request.configureExecutionInput((input,builder)->builder.graphQLContext(java.util.Map.of("authorization",token)).build());
   return WebClient.create(user).post().uri("/api/auth/validate").header("Authorization",token).retrieve().toBodilessEntity().timeout(Duration.ofSeconds(5)).onErrorMap(error -> new ResponseStatusException(error instanceof org.springframework.web.reactive.function.client.WebClientResponseException ex && ex.getStatusCode().value() == 401 ? HttpStatus.UNAUTHORIZED : HttpStatus.SERVICE_UNAVAILABLE)).then(chain.next(request));
  };
 }
 @Bean graphql.execution.instrumentation.Instrumentation limits() {
  return new graphql.execution.instrumentation.ChainedInstrumentation(java.util.List.of(new graphql.analysis.MaxQueryDepthInstrumentation(8),new graphql.analysis.MaxQueryComplexityInstrumentation(200)));
 }
}
