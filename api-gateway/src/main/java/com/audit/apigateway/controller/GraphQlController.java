package com.audit.apigateway.controller;
import org.springframework.stereotype.Controller;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.graphql.data.method.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.HttpMethod;
import reactor.core.publisher.Mono;
import graphql.schema.DataFetchingEnvironment;
import java.util.*;
import java.time.Duration;
@Controller
public class GraphQlController {
 private final String users,rooms,bookings;
 public GraphQlController(@Value("${services.user}") String u,@Value("${services.room}") String r,@Value("${services.booking}") String b){users=u;rooms=r;bookings=b;}
 private Mono<Object> call(String base,String path,HttpMethod method,Object body,DataFetchingEnvironment env){
  var request=WebClient.create(base).method(method).uri(path).header("Authorization",(String) env.getGraphQlContext().get("authorization"));
  return (body==null?request:request.bodyValue(body)).retrieve().bodyToMono(Object.class).timeout(Duration.ofSeconds(6));
 }
 @QueryMapping public Mono<Object> me(DataFetchingEnvironment e){return call(users,"/api/users/me",HttpMethod.GET,null,e);}
 @QueryMapping public Mono<Object> users(DataFetchingEnvironment e){return call(users,"/api/users",HttpMethod.GET,null,e);}
 @QueryMapping public Mono<Object> rooms(DataFetchingEnvironment e){return call(rooms,"/api/rooms",HttpMethod.GET,null,e);}
 @QueryMapping public Mono<Object> room(@Argument Long id,DataFetchingEnvironment e){return call(rooms,"/api/rooms/"+id,HttpMethod.GET,null,e);}
 @QueryMapping public Mono<Object> booking(@Argument Long id,DataFetchingEnvironment e){return call(bookings,"/api/bookings/"+id,HttpMethod.GET,null,e);}
 @QueryMapping public Mono<Object> bookings(@Argument int page,@Argument int size,@Argument Long roomId,@Argument Long userId,DataFetchingEnvironment e){
  if(page<0||size<1||size>100) return Mono.error(new IllegalArgumentException("Invalid page"));
  return call(bookings,"/api/bookings?page="+page+"&size="+size+(roomId==null?"":"&roomId="+roomId)+(userId==null?"":"&userId="+userId),HttpMethod.GET,null,e);
 }
 @MutationMapping public Mono<Object> createBooking(@Argument Map<String,Object> input,DataFetchingEnvironment e){return call(bookings,"/api/bookings",HttpMethod.POST,input,e);}
 @MutationMapping public Mono<Object> createRoom(@Argument Map<String,Object> input,DataFetchingEnvironment e){return call(rooms,"/api/rooms",HttpMethod.POST,input,e);}
 @MutationMapping public Mono<Boolean> cancelBooking(@Argument Long id,DataFetchingEnvironment e){return call(bookings,"/api/bookings/"+id+"/cancel",HttpMethod.POST,null,e).thenReturn(true);}
}
